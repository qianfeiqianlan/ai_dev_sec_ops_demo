import { Injectable } from '@nestjs/common';
import { isArmstrongNumber } from '@ai-devsecops/shared';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  isArmstrongNumber(value: number): boolean {
    return isArmstrongNumber(value);
  }
}
