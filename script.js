/* Nosso Cantinho V5 - backend bridge. The original V4 UI remains intact. */
(() => {
  const ready = () => {
    if (!window.supabase || !window.NC_SUPABASE_URL || !window.NC_SUPABASE_KEY) return;
    window.NC_DB = window.supabase.createClient(window.NC_SUPABASE_URL, window.NC_SUPABASE_KEY);
    window.NC_REMOTE = {
      async ensureAuth(){
        const {data:{session}} = await NC_DB.auth.getSession();
        if (session) return session.user;
        const {data,error}=await NC_DB.auth.signInAnonymously();
        if(error) throw error; return data.user;
      },
      async upload(file, owner, surpriseId){
        const ext=(file.name.split('.').pop()||'bin').toLowerCase();
        const path=`${owner}/${surpriseId}/${crypto.randomUUID()}.${ext}`;
        const {error}=await NC_DB.storage.from('surpresas').upload(path,file,{upsert:false,contentType:file.type});
        if(error) throw error;
        return NC_DB.storage.from('surpresas').getPublicUrl(path).data.publicUrl;
      },
      async create(payload){
        const user=await this.ensureAuth();
        const {data,error}=await NC_DB.from('surpresas').insert({...payload,owner_id:user.id}).select().single();
        if(error) throw error; return data;
      },
      async get(id){
        const {data,error}=await NC_DB.from('surpresas').select('*').eq('id',id).single();
        if(error) throw error; return data;
      }
    };
    window.dispatchEvent(new Event('nc:supabase-ready'));
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready); else ready();
})();
