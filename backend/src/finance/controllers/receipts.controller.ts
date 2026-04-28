import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReceiptsService } from '../services/receipts.service';
import {
  CreateReceiptTypeDto,
  UpdateReceiptTypeDto,
  CreateReceiptDto,
  UpdateReceiptDto,
} from '../dto/finance.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceiptsController {
  constructor(private readonly service: ReceiptsService) {}

  // ================= Receipt Types =================
  @Post('receipt-types')
  @Roles('admin', 'Super Admin')
  async createType(@Body() dto: CreateReceiptTypeDto) {
    return this.service.createType(dto);
  }

  @Get('receipt-types')
  async findAllTypes() {
    return this.service.findAllTypes();
  }

  @Get('receipt-types/:id')
  async findTypeById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findTypeById(id);
  }

  @Put('receipt-types/:id')
  @Roles('admin', 'Super Admin')
  async updateType(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReceiptTypeDto,
  ) {
    return this.service.updateType(id, dto);
  }

  @Delete('receipt-types/:id')
  @Roles('admin', 'Super Admin')
  async deleteType(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteType(id);
  }

  // ================= Receipts =================
  @Post('receipts')
  @Roles('admin', 'Super Admin')
  async createReceipt(@Body() dto: CreateReceiptDto, @Request() req) {
    return this.service.createReceipt(dto, req.user.id);
  }

  @Get('receipts')
  async findAllReceipts(
    @Query('skip') skipStr?: string,
    @Query('limit') limitStr?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('receipt_type_id') typeIdStr?: string,
  ) {
    const skip = skipStr ? parseInt(skipStr, 10) : 0;
    const limit = limitStr ? parseInt(limitStr, 10) : 100;
    const typeId = typeIdStr ? parseInt(typeIdStr, 10) : undefined;

    const [data, total] = await this.service.findAllReceipts(
      skip,
      limit,
      startDate,
      endDate,
      typeId,
    );
    return { data, meta: { total, skip, limit } };
  }

  @Get('receipts/:id')
  async findReceiptById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findReceiptById(id);
  }

  @Put('receipts/:id')
  @Roles('admin', 'Super Admin')
  async updateReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReceiptDto,
  ) {
    return this.service.updateReceipt(id, dto);
  }

  @Delete('receipts/:id')
  @Roles('admin', 'Super Admin')
  async deleteReceipt(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteReceipt(id);
  }
}
