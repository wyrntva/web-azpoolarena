import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard, AccountantOrAdminGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';
import { UserEntity } from './entities/user.entity';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) {
    return this.usersService.create(dto);
  }

  @Get()
  @UseGuards(AccountantOrAdminGuard)
  findAll(@Query('skip') skip?: number, @Query('limit') limit?: number) {
    return this.usersService.findAll(skip, limit);
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.usersService.remove(id, user.id);
  }

  @Post('update-display-order')
  @UseGuards(AdminGuard)
  updateDisplayOrder(
    @Body() body: { user_orders: { user_id: number; display_order: number }[] },
  ) {
    return this.usersService.updateDisplayOrder(body.user_orders);
  }
}
