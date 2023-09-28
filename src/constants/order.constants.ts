export const ACTIVE_STATUSES = [
  {
    id: '2dc692f9-bc6d-11eb-0a80-02cc002755de',
    name: 'Готов к выдаче'
  },
  {
    id: '2dc69269-bc6d-11eb-0a80-02cc002755dd',
    name: 'Запуск в производство'
  },
  {
    'id': '13716f6e-666d-11ed-0a80-023a000fabd4',
    'name': 'Принят в работу'
  },
  {
    'id': '03308539-9577-11ec-0a80-053a0030bebc',
    'name': 'В производстве'
  },
  {
    'id': '2dc692f9-bc6d-11eb-0a80-02cc002755de',
    'name': 'Готов к выдаче'
  },
  {
    'id': 'adfc0e33-066f-11ec-0a80-0d7f006d9352',
    'name': 'Частично готово'
  },
  {
    'id': '2dc69031-bc6d-11eb-0a80-02cc002755dc',
    'name': 'Выставлен счёт'
  },
  {
    'id': 'a789fffb-0f90-11ee-0a80-025d0000b294',
    'accountId': '2d88514c-bc6d-11eb-0a80-0df30000ff8b',
    'name': 'Частично отгружено'
  }
]


export const PROCESSING_ATTR_ORDER_NUMB_META = {
  "meta": {
    "href": "https://api.moysklad.ru/api/remap/1.2/entity/processing/metadata/attributes/9f04e4a9-5c94-11ee-0a80-067700174315",
    "type": "attributemetadata",
    "mediaType": "application/json"
  },
}


export const COMPLETED_PRODUCE_ORDER_STATUS_ATTR = {
  meta: {
    'href': 'https://api.moysklad.ru/api/remap/1.2/entity/customerorder/metadata/attributes/a2262c7f-d21f-11ed-0a80-012400380448',
    'type': 'attributemetadata',
    'mediaType': 'application/json'
  },
  value: {
    'meta': {
      'href': 'https://api.moysklad.ru/api/remap/1.2/entity/customentity/90d570fd-d21f-11ed-0a80-0f0a0037da9c/17b48f8b-5c76-11ee-0a80-054d00144e19',
      'metadataHref': 'https://api.moysklad.ru/api/remap/1.2/context/companysettings/metadata/customEntities/90d570fd-d21f-11ed-0a80-0f0a0037da9c',
      'type': 'customentity',
      'mediaType': 'application/json',
      'uuidHref': 'https://online.moysklad.ru/app/#custom_90d570fd-d21f-11ed-0a80-0f0a0037da9c/edit?id=17b48f8b-5c76-11ee-0a80-054d00144e19'
    }
  }
}
