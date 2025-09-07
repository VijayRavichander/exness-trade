import { redis_events_processed } from "./redis"

export const pendingRequests = new Map();

async function processIncomingMessage(streamName: string, messages: [id: string, fields: string[]][]): Promise<any> {

    const user_data = await JSON.parse(messages[0][1][1])

    return user_data;

}

export async function ingestFromProcessedEventsStream() {
    // Starts from the latest 
    // [TODO: Add a LastID from store/snapshot/file to handle server shutdown]
    let lastId = "$"

    // console.log('[ENGINE RUNNING...')

    while(true){
        try {
            const results = await redis_events_processed.xread(
                'COUNT', 1, 
                'BLOCK', 0,
                'STREAMS', 'events_processed', lastId
            );

            if(results && results.length > 0){
                const [streamName, messages] = results[0];

                const user_data = await processIncomingMessage(streamName, messages);
                
                const { tripId } = user_data
                
                if(pendingRequests.has(tripId)){
                    const {resolve} = pendingRequests.get(tripId);
                    pendingRequests.delete(tripId);
                    resolve(user_data);
                }
            }
        }catch(error){
            console.log("Error while Ingesting from Stream", error)
        }
    }
}