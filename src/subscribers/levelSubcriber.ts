import { EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm'
import { Level } from '../entities/level.entity'

@EventSubscriber()
export class levelSubcriber implements EntitySubscriberInterface<Level> {

  listenTo () {
    return Level
  }

  async beforeInsert ( event: InsertEvent<Level> ) {
    // const dataLevel = new Level()
    // dataLevel.id = 1
    // dataLevel.name = 'Prueba de nivel con seed'
    // console.error( 'llega al subcriber' )
    // await event.manager.getRepository( Level ).save( dataLevel )
  }


}
