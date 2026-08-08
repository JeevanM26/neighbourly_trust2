import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rcvxvnfejbwvokwzcuav.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdnh2bmZlamJ3dm9rd3pjdWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTY3MDIsImV4cCI6MjEwMTA5MjcwMn0.WPwp8CeGuP8AIPejbe1i-fwkEJ4HtE0Ime3WJWHOvJw';
const client1 = createClient(supabaseUrl, supabaseKey);
const client2 = createClient(supabaseUrl, supabaseKey);

async function testBroadcast() {
  const roomId = 'test_room_' + Date.now();
  console.log("Testing broadcast in room:", roomId);

  let received = false;

  const channel1 = client1.channel(roomId, {
    config: { broadcast: { self: true } }
  });
  channel1.on('broadcast', { event: 'ping' }, (payload) => {
    console.log("Client 1 received broadcast:", payload);
    received = true;
  });

  channel1.subscribe(async (status, err) => {
    console.log("Client 1 subscribe status:", status, err);
    if (status === 'SUBSCRIBED') {
      const channel2 = client2.channel(roomId, {
        config: { broadcast: { self: true } }
      });
      channel2.subscribe(async (status2, err2) => {
        console.log("Client 2 subscribe status:", status2, err2);
        if (status2 === 'SUBSCRIBED') {
          console.log("Client 2 sending broadcast...");
          const res = await channel2.send({
            type: 'broadcast',
            event: 'ping',
            payload: { message: 'hello from client 2' }
          });
          console.log("Client 2 send result:", res);
        }
      });
    }
  });

  await new Promise(res => setTimeout(res, 3000));
  
  if (received) {
    console.log("BROADCAST SUCCESSFUL");
  } else {
    console.log("BROADCAST FAILED or timed out");
  }

  process.exit(0);
}

testBroadcast();
