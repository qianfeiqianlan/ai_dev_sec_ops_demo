import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('armstrong/:value')
  checkArmstrongNumber(@Param('value') value: string): {
    value: number;
    isArmstrong: boolean;
  } {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('value must be a non-negative integer');
    }

    const numericValue = Number(value);

    if (!Number.isSafeInteger(numericValue)) {
      throw new BadRequestException('value must be a safe integer');
    }

    return {
      value: numericValue,
      isArmstrong: this.appService.isArmstrongNumber(numericValue),
    };
  }
}
