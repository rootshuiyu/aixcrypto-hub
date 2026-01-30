import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContractService } from './contract.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminTokenGuard } from '../auth/guards/admin-token.guard';

@ApiTags('contracts')
@Controller('super-admin-api-contracts') // 修改前缀，避免与 super-admin-api 产生层级冲突
@UseGuards(AdminTokenGuard)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get()
  @ApiOperation({ summary: '获取所有合约配置' })
  getAllContracts() {
    return this.contractService.getAllContracts();
  }

  @Get('chains')
  @ApiOperation({ summary: '获取支持的区块链列表' })
  getSupportedChains() {
    return this.contractService.getSupportedChains();
  }

  @Get('type/:type')
  @ApiOperation({ summary: '获取指定类型的合约列表' })
  getContractsByType(@Param('type') type: string) {
    return this.contractService.getContractsByType(type);
  }

  @Get('primary/:type')
  @ApiOperation({ summary: '获取指定类型的主合约' })
  getPrimaryContract(
    @Param('type') type: string,
    @Query('chainId') chainId?: string,
  ) {
    return this.contractService.getPrimaryContract(
      type, 
      chainId ? parseInt(chainId, 10) : undefined
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个合约配置' })
  getContractById(@Param('id') id: string) {
    return this.contractService.getContractById(id);
  }

  @Post()
  @ApiOperation({ summary: '添加新合约配置' })
  addContract(@Body() body: {
    name: string;
    type: string;
    version?: string;
    chainId: number;
    address: string;
    abi?: string;
    isPrimary?: boolean;
    deployedAt?: string;
    deployTxHash?: string;
    deployer?: string;
    metadata?: string;
    notes?: string;
  }) {
    return this.contractService.addContract({
      ...body,
      deployedAt: body.deployedAt ? new Date(body.deployedAt) : undefined,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: '更新合约配置' })
  updateContract(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      version?: string;
      address?: string;
      abi?: string;
      isActive?: boolean;
      isPrimary?: boolean;
      metadata?: string;
      notes?: string;
    },
  ) {
    return this.contractService.updateContract(id, body);
  }

  @Post(':id/primary')
  @ApiOperation({ summary: '设为主合约' })
  setAsPrimary(@Param('id') id: string) {
    return this.contractService.setAsPrimary(id);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: '切换启用状态' })
  toggleActive(@Param('id') id: string) {
    return this.contractService.toggleActive(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除合约配置' })
  deleteContract(@Param('id') id: string) {
    return this.contractService.deleteContract(id);
  }

  @Post('verify')
  @ApiOperation({ summary: '验证合约地址' })
  verifyAddress(@Body() body: { chainId: number; address: string }) {
    return this.contractService.verifyAddress(body.chainId, body.address);
  }

  @Post('fetch-abi')
  @ApiOperation({ summary: '从区块浏览器获取 ABI' })
  fetchAbi(@Body() body: { chainId: number; address: string }) {
    return this.contractService.fetchAbiFromExplorer(body.chainId, body.address);
  }

  @Post(':id/test')
  @ApiOperation({ summary: '测试合约连接' })
  testConnection(@Param('id') id: string) {
    return this.contractService.testConnection(id);
  }

  @Post('cache/refresh')
  @ApiOperation({ summary: '刷新缓存' })
  refreshCache() {
    return this.contractService.refreshCache();
  }
}

