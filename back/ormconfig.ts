import { configService } from './src/config/config.service'
import { DataSource } from 'typeorm'

const AppDataSource = new DataSource({
  ...configService.getTypeOrmConfig(),
})

export default AppDataSource
