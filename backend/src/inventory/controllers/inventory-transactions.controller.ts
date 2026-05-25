import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryTransactionsService } from '../services/inventory-transactions.service';
import { CreateTransactionDto } from '../dto/inventory.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryTransactionsController {
  constructor(private readonly txService: InventoryTransactionsService) {}

  @Post('inventory-in')
  @Roles('admin', 'Super Admin')
  async createIn(@Body() dto: CreateTransactionDto, @Request() req) {
    return this.txService.createInTransaction(dto, req.user.id);
  }

  @Get('inventory-in')
  async getIns(
    @Query('skip') skipStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const skip = skipStr ? parseInt(skipStr, 10) : 0;
    const limit = limitStr ? parseInt(limitStr, 10) : 100;
    return this.txService.findIns(skip, limit);
  }

  @Post('inventory-out')
  @Roles('admin', 'Super Admin')
  async createOut(@Body() dto: CreateTransactionDto, @Request() req) {
    return this.txService.createOutTransaction(dto, req.user.id);
  }

  @Get('inventory-out')
  async getOuts(
    @Query('skip') skipStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const skip = skipStr ? parseInt(skipStr, 10) : 0;
    const limit = limitStr ? parseInt(limitStr, 10) : 100;
    return this.txService.findOuts(skip, limit);
  }
}
