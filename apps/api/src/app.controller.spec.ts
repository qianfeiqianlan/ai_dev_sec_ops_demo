import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('checkArmstrongNumber', () => {
    it.each([
      [0, true],
      [1, true],
      [153, true],
      [370, true],
      [371, true],
      [9474, true],
      [9475, false],
      [154, false],
    ])('should check whether %i is an Armstrong number', (value, expected) => {
      expect(appController.checkArmstrongNumber(String(value))).toEqual({
        value,
        isArmstrong: expected,
      });
    });

    it('should reject non-integer input', () => {
      expect(() => appController.checkArmstrongNumber('12.3')).toThrow(
        'value must be a non-negative integer',
      );
    });

    it('should reject unsafe integers', () => {
      expect(() =>
        appController.checkArmstrongNumber('9007199254740992'),
      ).toThrow('value must be a safe integer');
    });
  });
});
