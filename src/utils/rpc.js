const RPC = require("discord-rpc");
const CLIENT_ID = "1527093914488541354";
const ACTIVITIES = {
  infection:{name:"Playing Infection",image:"infection"}, parkour:{name:"Playing Parkour",image:"parkour"}, creative:{name:"Playing Creative",image:"creative"},
  "hide-and-seek":{name:"Playing Hide And Seek",image:"hideandseek"}, "the-war":{name:"Playing The War",image:"thewar"}, survival:{name:"Playing Survival",image:"survival"},
  "one-block":{name:"Playing One Block",image:"oneblock"}, "creators-realm":{name:"Playing Creators Realm",image:"creatorsrealm"}, peaceful:{name:"Playing Peaceful",image:"peaceful"},
  hardcore:{name:"Playing Hardcore",image:"hardcore"}, custom:{name:"Playing Custom Games",image:"soon"}, bedwars:{name:"Playing Bedwars",image:"bedwars"},
  "sky-wars":{name:"Playing SkyWars",image:"skywars"}, raid:{name:"Playing Raid",image:"raid"}, "steal-a-pet":{name:"Playing Steal A Pet",image:"stealapet"},
  "dress-up":{name:"Playing Dress Up",image:"dressup"}, "garden-grow":{name:"Playing Garden Grow",image:"gardengrow"}, "custom-games":{name:"Viewing Custom Games"}, pets:{name:"Viewing Pets"},
  shop:{name:"Viewing Shop"}, rules:{name:"Viewing Rules"}, news:{name:"Viewing News"}, profile:{name:"Viewing Profile"}, lobby:{name:"In Lobby"}
};
RPC.register(CLIENT_ID);
const rpc = new RPC.Client({transport:"ipc"});
const startTimestamp = new Date();
rpc.on("ready",()=>{console.log("[Matrix] RPC Connected"); rpc.setActivity({details:"In Lobby",state:"on MineFun.io",largeImageKey:"logo",startTimestamp});});
rpc.login({clientId:CLIENT_ID}).catch(console.error);
function updatePresence(page,roomId=null,hideRoom=false,isSandbox=false){
  if(!rpc.user)return;
  const activity=ACTIVITIES[page]||{name:page,image:"logo"};
  const inMatch=!!activity.image&&activity.image!=="logo";
  const sandboxTag=isSandbox?" (Sandbox)":"";
  rpc.setActivity({details:activity.name+sandboxTag,state:(roomId&&!hideRoom)?`on Room ${roomId}`:"on MineFun.io",largeImageKey:activity.image||"logo",largeImageText:activity.name,smallImageKey:inMatch?"logo":undefined,smallImageText:inMatch?"Matrix Client":undefined,startTimestamp});
}
module.exports={rpc,updatePresence};
