(function(){
  "use strict";
  if(window.__matrixAdvancedModsLoaded)return;
  window.__matrixAdvancedModsLoaded=true;
  const URL="https://celestarminefun.github.io/celestar-mod-menu-v2.js";
  let running=false;
  async function enable(){
    if(running)return {ok:true,enabled:true};
    try{
      const r=await fetch(URL,{cache:"no-store"});
      if(!r.ok)throw new Error("HTTP "+r.status);
      const js=await r.text();
      (0,eval)(js);
      running=true;
      return {ok:true,enabled:true};
    }catch(e){
      console.error("[Matrix] Advanced mods failed:",e);
      return {ok:false,enabled:false,error:e.message};
    }
  }
  async function disable(){location.reload();return {ok:true,enabled:false};}
  window.__matrixAdvancedMods={enable,disable,isEnabled:()=>running};
})();
