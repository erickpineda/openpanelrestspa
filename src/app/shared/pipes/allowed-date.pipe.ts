import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { parseAllowedDate } from '../utils/date-utils';

@Pipe({
  name: 'allowedDate',
  standalone: true,
})
export class AllowedDatePipe implements PipeTransform {
  constructor(private datePipe: DatePipe) {}

  transform(
    value: string | Date | number | null | undefined,
    format: string = 'mediumDate'
  ): string | null {
    const date = parseAllowedDate(value);
    if (!date) return null;
    return this.datePipe.transform(date, format);
  }
}
