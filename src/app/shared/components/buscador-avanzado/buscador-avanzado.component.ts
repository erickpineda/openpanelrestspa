import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  BuscadorCampoDef,
  BuscadorDefinicionesAdaptadas,
  getBuscadorDefinicionesAmigables,
} from '../../utils/buscador-definiciones.util';
import {
  SearchConditionNode,
  SearchGroupNode,
  SearchGroupOp,
  SearchNode,
  SearchQuery,
} from '../../models/search.models';
import {
  serializeDateInputToBackend,
  serializeDateTimeLocalInputToBackend,
} from '../../utils/date-utils';

/**
 * BuscadorAvanzadoComponent (v2)
 * - Editor recursivo de un árbol SearchQuery.node (group/condition).
 * - Renderiza campos/operaciones en base a SearchDefinitionsDTO.fields.
 * - Serializa date/datetime-local a los formatos públicos del backend.
 */
@Component({
  selector: 'app-buscador-avanzado',
  templateUrl: './buscador-avanzado.component.html',
  styleUrls: ['./buscador-avanzado.component.scss'],
  standalone: false,
})
export class BuscadorAvanzadoComponent implements OnChanges, OnDestroy {
  // =================== Inputs ===================
  @Input() definiciones: any;
  @Input() autoTrigger: boolean = false;
  @Input() debounceMs: number = 300;
  @Input() showButton: boolean = true;
  @Input() showSearchButton?: boolean;
  @Input() showClearButton: boolean = false;
  @Input() placeholder: string = 'Ingrese valor a buscar';
  @Input() defaultField?: string;
  @Input() camposPrioritarios: string[] = [];
  @Input() camposCatalogo: string[] = [];
  @Input() cargarCatalogosFn?: () => import('rxjs').Observable<{ [key: string]: string[] }>;

  // =================== Outputs ===================
  @Output() filtroSeleccionado = new EventEmitter<SearchQuery>();
  @Output() filtroChanged = new EventEmitter<SearchQuery>();
  @Output() onSearch = new EventEmitter<SearchQuery>();
  @Output() onClear = new EventEmitter<void>();

  // =================== State ===================
  public adaptedDefs?: BuscadorDefinicionesAdaptadas;
  public root!: SearchGroupNodeUI;
  public catalogosError: string | null = null;

  private idSeq = 0;
  private catalogOptions: { [key: string]: string[] } = {};
  private catalogosSub?: Subscription;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['definiciones'] && this.definiciones) {
      this.inicializarBuscador();
    }
  }

  ngOnDestroy(): void {
    this.catalogosSub?.unsubscribe();
  }

  // =================== UI helpers ===================
  public debeMostrarBotonBusqueda(): boolean {
    return this.showSearchButton !== undefined ? this.showSearchButton : this.showButton;
  }

  public trackByNode = (_: number, n: SearchNodeUI) => n._id;

  public buscar(): void {
    if (!this.root) this.root = this.createDefaultRoot();
    const payload = this.buildQuery();
    this.filtroSeleccionado.emit(payload);
    this.onSearch.emit(payload);
  }

  public limpiar(): void {
    this.root = this.createDefaultRoot();
    const payload = this.buildQuery();
    if (this.autoTrigger) this.filtroChanged.emit(payload);
    this.filtroSeleccionado.emit(payload);
    this.onClear.emit();
  }

  public onNodeChange(): void {
    if (!this.autoTrigger) return;
    this.filtroChanged.emit(this.buildQuery());
  }

  public addCondition(parent: SearchGroupNodeUI): void {
    parent.children = [...parent.children, this.createDefaultCondition()];
    this.onNodeChange();
  }

  public addGroup(parent: SearchGroupNodeUI): void {
    parent.children = [
      ...parent.children,
      this.createGroup('AND', [this.createDefaultCondition()]),
    ];
    this.onNodeChange();
  }

  public removeNode(parent: SearchGroupNodeUI, index: number): void {
    parent.children = parent.children.filter((_, i) => i !== index);
    if (parent.children.length === 0) parent.children = [this.createDefaultCondition()];
    this.onNodeChange();
  }

  public onFieldChange(node: SearchConditionNodeUI): void {
    const ops = this.getOperationsForField(node.field);
    node.op = (ops[0]?.value as any) || 'contains';
    node.value = '';
    this.onNodeChange();
  }

  public onOpChange(node: SearchConditionNodeUI): void {
    if (node.op === 'null' || node.op === 'not_null') {
      delete (node as any).value;
    } else if (node.value === undefined) {
      node.value = '';
    }
    this.onNodeChange();
  }

  public getOrderedFields(): BuscadorCampoDef[] {
    const campos = this.adaptedDefs?.campos || [];
    return [
      ...campos.filter((c) => this.camposPrioritarios.includes(c.key)),
      ...campos
        .filter((c) => !this.camposPrioritarios.includes(c.key))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }

  public getFieldDef(fieldKey: string): BuscadorCampoDef | undefined {
    return this.adaptedDefs?.campos?.find((c) => c.key === fieldKey);
  }

  public getOperationsForField(fieldKey: string): { value: string; label: string }[] {
    const def = this.getFieldDef(fieldKey);
    return (def?.operaciones || []) as any[];
  }

  public getSelectOptions(fieldKey: string): string[] {
    const def = this.getFieldDef(fieldKey);
    if (!def) return [];
    if (Array.isArray(def.enumValues) && def.enumValues.length > 0) return def.enumValues;
    if (this.catalogOptions && this.catalogOptions[fieldKey]) return this.catalogOptions[fieldKey];
    return [];
  }

  public shouldShowValueInput(node: SearchConditionNodeUI): boolean {
    return !(node.op === 'null' || node.op === 'not_null');
  }

  // =================== Init / Catalogs ===================
  private inicializarBuscador(): void {
    this.adaptedDefs = getBuscadorDefinicionesAmigables(this.definiciones);

    const contieneCamposCatalogo = (this.adaptedDefs?.campos || []).some((c) =>
      this.camposCatalogo.includes(c.key)
    );
    if (contieneCamposCatalogo && this.cargarCatalogosFn) {
      this.cargarCatalogosGenerico();
    }

    const ejemploNode = (this.adaptedDefs?.ejemplo as any)?.node as SearchNode | undefined;
    if (ejemploNode) {
      const ui = this.toUI(ejemploNode);
      this.root = ui.type === 'group' ? ui : this.wrapRoot(ui);
    } else {
      this.root = this.createDefaultRoot();
    }
  }

  private cargarCatalogosGenerico(): void {
    if (Object.keys(this.catalogOptions).length > 0) return;
    this.catalogosError = null;
    if (!this.cargarCatalogosFn) return;
    this.catalogosSub = this.cargarCatalogosFn().subscribe({
      next: (mapped) => {
        this.catalogOptions = { ...mapped };
      },
      error: () => {
        this.catalogosError = 'Error al cargar catálogos. Intente recargar la página.';
      },
    });
  }

  // =================== DTO build ===================
  private buildQuery(): SearchQuery {
    return { node: this.stripAndSerialize(this.root) };
  }

  private stripAndSerialize(node: SearchNodeUI): SearchNode {
    if (node.type === 'group') {
      const g = node as SearchGroupNodeUI;
      const children = (g.children || []).map((c) => this.stripAndSerialize(c));
      return { type: 'group', op: g.op, children };
    }

    const c = node as SearchConditionNodeUI;
    const def = this.getFieldDef(c.field);
    const op = String(c.op ?? '').trim();

    if (op === 'null' || op === 'not_null') {
      return { type: 'condition', field: c.field, op };
    }

    let value: any = c.value;
    if (def?.tipo === 'date' && typeof value === 'string') {
      value = serializeDateInputToBackend(value) ?? value;
    }
    if (def?.tipo === 'datetime' && typeof value === 'string') {
      value = serializeDateTimeLocalInputToBackend(value) ?? value;
    }

    return { type: 'condition', field: c.field, op, value };
  }

  // =================== UI node factories ===================
  private nextId(): string {
    this.idSeq += 1;
    return String(this.idSeq);
  }

  private createDefaultRoot(): SearchGroupNodeUI {
    return this.createGroup('AND', [this.createDefaultCondition()]);
  }

  private createGroup(op: SearchGroupOp, children: SearchNodeUI[]): SearchGroupNodeUI {
    return { type: 'group', op, children, _id: this.nextId() };
  }

  private createDefaultCondition(): SearchConditionNodeUI {
    const ordered = this.getOrderedFields();
    const field =
      (this.defaultField && ordered.some((c) => c.key === this.defaultField)
        ? this.defaultField
        : ordered[0]?.key) || '';
    const ops = this.getOperationsForField(field);
    const op = (ops[0]?.value as any) || 'contains';
    return { type: 'condition', field, op, value: '', _id: this.nextId() };
  }

  private wrapRoot(node: SearchNodeUI): SearchGroupNodeUI {
    return this.createGroup('AND', [node]);
  }

  private toUI(node: SearchNode): SearchNodeUI {
    if (node.type === 'group') {
      const g = node as SearchGroupNode;
      return {
        type: 'group',
        op: g.op,
        children: (g.children || []).map((c) => this.toUI(c)),
        _id: this.nextId(),
      };
    }
    const c = node as SearchConditionNode;
    return { type: 'condition', field: c.field, op: c.op, value: c.value, _id: this.nextId() };
  }
}

interface SearchGroupNodeUI extends SearchGroupNode {
  _id: string;
  children: SearchNodeUI[];
}

interface SearchConditionNodeUI extends SearchConditionNode {
  _id: string;
}

type SearchNodeUI = SearchGroupNodeUI | SearchConditionNodeUI;
