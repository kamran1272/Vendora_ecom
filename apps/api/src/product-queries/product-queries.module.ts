import { Module } from '@nestjs/common'
import { ProductQueriesController } from './product-queries.controller'
import { ProductQueriesService } from './product-queries.service'

@Module({ controllers: [ProductQueriesController], providers: [ProductQueriesService] })
export class ProductQueriesModule {}
