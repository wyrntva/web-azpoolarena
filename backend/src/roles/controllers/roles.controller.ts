import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RolesService } from '../services/roles.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';

@Controller('api/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'Super Admin', 'Quản lý')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll() {
    // The frontend role API usually expects response.data to have the array,
    // let's match standard format, if frontend expects raw array or {data: array}
    // We'll wrap in data/return raw depending on standard. `res.data` means raw if standard axios.
    // wait `roleAPI.getRoles()` returns `AxiosResponse<Role[]>` so it's a raw array probably! I will return raw array to be safe, BUT some fastAPIs return array natively or nested. FastAPI usually returns array natively for getRoles if it's `response_model=List[Role]`. Let's just return the raw array! Wait, let's look at `users` to emulate standard.
    // I will return the array directly, no `data:` wrapper because `AxiosResponse<Role[]>` means the JSON itself is the array.
    return this.rolesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }

  @Post()
  async create(@Body() createRoleDto: any) {
    return this.rolesService.create(createRoleDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: any) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(+id);
    return { detail: 'Successfully deleted' };
  }
}
