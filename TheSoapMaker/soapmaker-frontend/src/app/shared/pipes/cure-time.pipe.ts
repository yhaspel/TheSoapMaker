import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a cure time in days into a human-readable string.
 * Usage: {{ 28 | cureTime }} → "4 weeks"
 */
@Pipe({
  name: 'cureTime',
  standalone: true,
})
export class CureTimePipe implements PipeTransform {
  transform(days: number): string {
    if (!days || days <= 0) return 'Unknown';
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
    const weeks = Math.round(days / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  }
}
