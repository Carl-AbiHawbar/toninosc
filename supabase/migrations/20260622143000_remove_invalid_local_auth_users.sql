delete from auth.users
where email like '%@tonino.local'
   or email like '%@app.toninocrepes.com';
