import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  isArmstrongNumber(value: number): boolean {
    if (!Number.isInteger(value) || value < 0) {
      return false;
    }

    const digits = value.toString().split('').map(Number);
    const power = digits.length;
    const sum = digits.reduce((total, digit) => total + digit ** power, 0);

    return sum === value;
  }
}
