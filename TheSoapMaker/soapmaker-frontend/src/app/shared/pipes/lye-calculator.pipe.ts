import { Pipe, PipeTransform } from '@angular/core';

/**
 * Calculates the NaOH (lye) amount for a given oil weight and saponification value.
 * Usage: {{ oilGrams | lyeCalculator: sapValue : superfatPercent }}
 */
@Pipe({
  name: 'lyeCalculator',
  standalone: true,
})
export class LyeCalculatorPipe implements PipeTransform {
  transform(oilGrams: number, sapValue: number, superfatPercent: number = 5): number {
    if (!oilGrams || !sapValue) return 0;
    return parseFloat((oilGrams * sapValue * (1 - superfatPercent / 100)).toFixed(2));
  }
}
