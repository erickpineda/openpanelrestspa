import { Component, OnDestroy, ChangeDetectionStrategy, input, output, effect, ChangeDetectorRef } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
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
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule, FormModule, GridModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * BuscadorAvanzadoComponent (v2) - Signals + OnPush
 */
@Component({
  selector: 'app-buscador-avanzado',
  templateUrl: './buscador-avanzado.component.html',
  styleUrls: ['./buscador-avanzado.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    FormModule,
    GridModule,
    IconModule,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscadorAvanzadoComponent implements OnDestroy {
  // =================== Inputs ===================
  definiciones = input<any>();
  autoTrigger = input<boolean>(false);
  debounceMs = input<number>(300);
  showButton = input<boolean>(true);
  showSearchButton = input<boolean | undefined>();
  showClearButton = input<boolean>(false);
  placeholder = input<string>('Ingrese valor a buscar');
  defaultField = input<string | undefined>();
  camposPrioritarios = input<string[]>([]);
  camposCatalogo = input<string[]>([]);
  cargarCatalogosFn = input<(() => Observable<{ [key: string]: string[] }>) | undefined>();

  // =================== Outputs ===================
  filtroSeleccionado = output<SearchQuery>();
  filtroChanged = output<SearchQuery>();
  onSearch = output<SearchQuery>();
  onClear = output<void>();

  // =================== State ===================
  public adaptedDefs?: BuscadorDefinicionesAdaptadas;
  public root!: SearchGroupNodeUI;
  public catalogosError: string | null = null;

  private idSeq = 0;
  private catalogOptions: { [key: string]: string[] } = {};
  private catalogosSub?: Subscription;

  constructor(private cdr: ChangeDetectorRef) {
    effect(() => {
      const defs = this.definiciones();
      if (defs) {
        this.inicializarBuscador();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.catalogosSub?.unsubscribe();
  }

  // =================== UI helpers ===================
  public debeMostrarBotonBusqueda(): boolean {
    const ssb = this.showSearchButton();
    return ssb !== undefined ? ssb : this.showButton();
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
    if (this.autoTrigger()) this.filtroChanged.emit(payload);
    this.filtroSeleccionado.emit(payload);
    this.onClear.emit();
  }

  public onNodeChange(): void {
    if (!this.autoTrigger()) return;
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
    const prioritarios = this.camposPrioritarios() || [];
    return [
      ...campos.filter((c) => prioritarios.includes(c.key)),
      ...campos
        .filter((c) => !prioritarios.includes(c.key))
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

  public shouldUseCatalogSelect(node: SearchConditionNodeUI): boolean {
    if (!node) return false;
    const fieldKey = String(node.field || '');
    if (!fieldKey) return false;
    const catalogo = this.camposCatalogo() || [];
    if (!catalogo.includes(fieldKey)) return false;
    if (!this.isEqualityOp(node.op)) return false;
    return true;
  }

  public shouldShowValueInput(node: SearchConditionNodeUI): boolean {
    return !(node.op === 'null' || node.op === 'not_null');
  }

  // =================== Init / Catalogs ===================
  private inicializarBuscador(): void {
    this.adaptedDefs = getBuscadorDefinicionesAmigables(this.definiciones());

    const catalogo = this.camposCatalogo() || [];
    const contieneCamposCatalogo = (this.adaptedDefs?.campos || []).some((c) =>
      catalogo.includes(c.key)
    );
    
    const cargarFn = this.cargarCatalogosFn();
    if (contieneCamposCatalogo && cargarFn) {
      this.cargarCatalogosGenerico(cargarFn);
    }

    const ejemploNode = (this.adaptedDefs?.ejemplo as any)?.node as SearchNode | undefined;
    if (ejemploNode) {
      const ui = this.toUI(ejemploNode);
      this.root = ui.type === 'group' ? ui : this.wrapRoot(ui);
    } else {
      this.root = this.createDefaultRoot();
    }
  }

  private cargarCatalogosGenerico(cargarFn: () => Observable<{ [key: string]: string[] }>): void {
    if (Object.keys(this.catalogOptions).length > 0) return;
    this.catalogosError = null;
    this.catalogosSub = cargarFn().subscribe({
      next: (mapped) => {
        this.catalogOptions = { ...mapped };
        this.cdr.markForCheck();
      },
      error: () => {
        this.catalogosError = 'Error al cargar catálogos. Intente recargar la página.';
        this.cdr.markForCheck();
      },
    });
  }

  // =================== DTO build ===================
  private buildQuery(): SearchQuery {
    const node = this.stripAndSerialize(this.root);
    return { node: node ?? this.buildFallbackNode() };
  }

  private stripAndSerialize(node: SearchNodeUI): SearchNode | null {
    if (node.type === 'group') {
      const g = node as SearchGroupNodeUI;
      const children = (g.children || [])
        .map((c) => this.stripAndSerialize(c))
        .filter((n): n is SearchNode => n != null);
      if (children.length === 0) return null;
      return { type: 'group', op: g.op, children };
    }

    const c = node as SearchConditionNodeUI;
    const def = this.getFieldDef(c.field);
    const op = String(c.op ?? '').trim();
    const opLower = op.toLowerCase();

    if (opLower === 'null' || opLower === 'not_null') {
      return { type: 'condition', field: c.field, op };
    }

    let value: any = c.value;
    if (value === '' || value === null || value === undefined) {
      const isContains = opLower === 'contains';
      const isString = (def?.tipo || 'string') === 'string';
      if (!(isContains && isString)) {
        return null;
      }
    }
    if (def?.tipo === 'date' && typeof value === 'string') {
      value = serializeDateInputToBackend(value) ?? value;
    }
    if (def?.tipo === 'datetime' && typeof value === 'string') {
      value = serializeDateTimeLocalInputToBackend(value) ?? value;
    }

    return { type: 'condition', field: c.field, op, value };
  }

  private buildFallbackNode(): SearchNode {
    const fields = this.getOrderedFields();
    const stringField = fields.find((f) => f.tipo === 'string')?.key;
    if (stringField) {
      return { type: 'condition', field: stringField, op: 'contains', value: '' };
    }
    const anyField = fields[0]?.key || '';
    return { type: 'condition', field: anyField, op: 'not_null' };
  }

  private isEqualityOp(op: any): boolean {
    const o = String(op || '').toLowerCase();
    return o === 'equal' || o === 'not_equal';
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
    const defaultF = this.defaultField();
    const field =
      (defaultF && ordered.some((c) => c.key === defaultF)
        ? defaultF
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
