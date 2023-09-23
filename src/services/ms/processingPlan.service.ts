import {
  DEFAULT_METAL_THICKNESS,
  PROCESSING_PLAN_GROUP_FACING,
  PROCESSING_PLAN_GROUP_ROOF,
  PROCESSING_PLAN_GROUP_WALL
} from '../../constants/processingPlan.constants'
import { msApi } from '../http.service'
import { Facing } from '../../utils/facing'
import { msCodeService } from './msCodeService'
import { productService } from './product.service'
import { GLUE_ID, TAPE_ID } from '../../constants/product.constants'
import { ProcessingPlan } from '../../types/processingPlan.types'
import { Panel } from '../../utils/panel'
import { PanelCalculator } from '../../utils/panelCalculator'
import { Modification } from '../../types/product.types'


type  CreateProcessingPlanRes = Promise<{
  name: string,
  status: 'archived' | 'exists' | 'created',
  processingPlan?: ProcessingPlan
}>

class ProcessingPlanService {
  private getProcessingPlanGroup = (productType: string) => {
    if (productType === 'стеновая ППС' || productType === 'стеновая МВ') {
      return PROCESSING_PLAN_GROUP_WALL
    }
    if (productType === 'кровельная ППС' || productType === 'кровельная МВ') {
      return PROCESSING_PLAN_GROUP_ROOF
    }
    if (productType === 'фасонное изделие') {
      return PROCESSING_PLAN_GROUP_FACING
    }
  }

  getProcessingPlanByName = async (name: string) => {
    const { data } = await msApi.get<{ rows: ProcessingPlan[] }>(`/processingplan?search=${name}`)
    return data.rows.find((p) => p.name === name)
  }

  createFacingProcessingPlan = async (modification: Modification): CreateProcessingPlanRes => {
    if (modification.archived) return { name: modification.name, status: 'archived' }
    const existingProcessingPlan = await this.getProcessingPlanByName(modification.name)
    if (existingProcessingPlan) {
      return { name: modification.name, status: 'exists', processingPlan: existingProcessingPlan }
    }
    const facingName = modification.name
    const facing = new Facing(facingName)
    const metalCode = msCodeService.getMetal(facing.color, DEFAULT_METAL_THICKNESS, '1200')
    const materials = [
      { // МЕТАЛЛ
        assortment: await productService.searchOneProductByCode(metalCode),
        quantity: facing.weight * 3.6 / 1000
      },
      { // ПЛЕНКА
        assortment: await productService.getProductById(TAPE_ID),
        quantity: facing.weight
      }
    ]

    const processingPlanData = {
      name: facingName,
      products: [{ assortment: modification, quantity: 1 }],
      materials,
      parent: PROCESSING_PLAN_GROUP_FACING,
      cost: (facing.weight * 120) * 100
    }
    const { data: processingPlan } = await msApi.post('/processingplan', processingPlanData)
    return { name: modification.name, status: 'created', processingPlan }
  }

  createPanelProcessingPlan = async (modification: Modification): CreateProcessingPlanRes => {
    if (modification.archived) {
      return { name: modification.name, status: 'archived' }
    }
    const existingProcessingPlan = await this.getProcessingPlanByName(modification.name)
    if (existingProcessingPlan) {
      return { name: modification.name, status: 'exists', processingPlan: existingProcessingPlan }
    }

    const panelName = modification.name

    const panel = new Panel(panelName)
    const topMetalCode = msCodeService.getMetal(panel.colors[0], DEFAULT_METAL_THICKNESS, panel.isWall ? panel.width : '1200')
    const bottomMetalCode = msCodeService.getMetal(panel.colors[1], DEFAULT_METAL_THICKNESS, panel.width)
    const materials = [
      { // ВЕРХНИЙ ЛИСТ МЕТАЛЛА
        assortment: await productService.searchOneProductByCode(topMetalCode),
        quantity: PanelCalculator.getMetal(panel.type, panel.weight).top
      },
      { // НИЖНИЙ ЛИСТ МЕТАЛЛА
        assortment: await productService.searchOneProductByCode(bottomMetalCode),
        quantity: PanelCalculator.getMetal(panel.type, panel.weight).bottom
      },
      { // ПЛЕНКА
        assortment: await productService.getProductById(TAPE_ID),
        quantity: PanelCalculator.getTape(panel.type, panel.width, panel.weight)
      },
      { // КЛЕЙ
        assortment: await productService.getProductById(GLUE_ID),
        quantity: PanelCalculator.getGlue(panel.name, panel.weight)
      },
      { // УТЕПЛИТЕЛЬ
        assortment: await productService.searchOneProductByCode(msCodeService.getFiller(panelName)),
        quantity: PanelCalculator.getFiller(panel.type, panel.width, panel.depth, panel.weight)
      }
    ]
    const processingPlanData = {
      name: panelName,
      products: [
        {
          assortment: modification,
          quantity: 1
        }
      ],
      materials,
      parent: this.getProcessingPlanGroup(panel.type),
      cost: (panel.weight * 200) * 100
    }
    const { data: processingPlan } = await msApi.post('/processingplan', processingPlanData)
    return { name: modification.name, status: 'created', processingPlan }
  }
}

export const processingPlanService = new ProcessingPlanService()

