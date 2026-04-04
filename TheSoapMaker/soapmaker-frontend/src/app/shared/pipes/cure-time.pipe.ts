import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a cure time in days into a human-readable string.
 * < 7 days → "X days"
 * < 56 days → "X weeks"
 * >= 56 days → "X months" (using 28 days/month)
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
    if (days < 56) {
      const weeks = Math.round(days / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    }
    const months = Math.round(days / 28);
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
}

