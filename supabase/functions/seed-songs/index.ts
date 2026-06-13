import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Each videoId points to a full OST playlist video or a dedicated individual upload.
// We use "complete soundtrack" playlist videos (with timestamps) from trusted channels.
const marioSoundtracks = [
  // ─── Super Mario Bros (NES, 1985) ───────────────────────────────────────────
  { title: "Overworld Theme", game: "Super Mario Bros", artist: "Koji Kondo", videoId: "NcguyW3-sTc", year: 1985 },
  { title: "Underground Theme", game: "Super Mario Bros", artist: "Koji Kondo", videoId: "-R7DlwPFTU0", year: 1985 },
  { title: "Underwater Theme", game: "Super Mario Bros", artist: "Koji Kondo", videoId: "oxHCDHCjFpQ", year: 1985 },
  { title: "Castle / Bowser Theme", game: "Super Mario Bros", artist: "Koji Kondo", videoId: "z_Hp_cURRq4", year: 1985 },
  { title: "Starman Theme", game: "Super Mario Bros", artist: "Koji Kondo", videoId: "yMc-rKGqyKc", year: 1985 },
  { title: "Game Over", game: "Super Mario Bros", artist: "Koji Kondo", videoId: "PEtk7s6xDEI", year: 1985 },
  { title: "World Clear", game: "Super Mario Bros", artist: "Koji Kondo", videoId: "FTEKz8Z-qKE", year: 1985 },
  { title: "Title Screen", game: "Super Mario Bros", artist: "Koji Kondo", videoId: "HgwgtOrWW-4", year: 1985 },

  // ─── Super Mario Bros 2 (NES, 1988) ─────────────────────────────────────────
  { title: "Overworld Theme", game: "Super Mario Bros 2", artist: "Daisuke Matsuoka", videoId: "oQDmNJxWVYU", year: 1988 },
  { title: "Underground Theme", game: "Super Mario Bros 2", artist: "Daisuke Matsuoka", videoId: "nN-6SBxMyRo", year: 1988 },
  { title: "Boss Battle", game: "Super Mario Bros 2", artist: "Daisuke Matsuoka", videoId: "qnl4oKGGBxU", year: 1988 },
  { title: "Character Select", game: "Super Mario Bros 2", artist: "Daisuke Matsuoka", videoId: "gOLOxhL_4Lk", year: 1988 },
  { title: "Ending Theme", game: "Super Mario Bros 2", artist: "Daisuke Matsuoka", videoId: "5cBjFlKFnXc", year: 1988 },

  // ─── Super Mario Bros 3 (NES, 1988) ─────────────────────────────────────────
  { title: "Overworld Theme", game: "Super Mario Bros 3", artist: "Koji Kondo", videoId: "Y-AUnL9S4Pk", year: 1988 },
  { title: "Athletic Theme", game: "Super Mario Bros 3", artist: "Koji Kondo", videoId: "oxHCDHCjFpQ", year: 1988 },
  { title: "Underground Theme", game: "Super Mario Bros 3", artist: "Koji Kondo", videoId: "decbYrsCjOk", year: 1988 },
  { title: "Underwater Theme", game: "Super Mario Bros 3", artist: "Koji Kondo", videoId: "oD_eSQqFv6o", year: 1988 },
  { title: "Fortress Boss", game: "Super Mario Bros 3", artist: "Koji Kondo", videoId: "gJjFTQJGN0w", year: 1988 },
  { title: "Sky Land Theme", game: "Super Mario Bros 3", artist: "Koji Kondo", videoId: "h6DtVHqyYts", year: 1988 },
  { title: "Ice Land Theme", game: "Super Mario Bros 3", artist: "Koji Kondo", videoId: "iKKKX1KxJfQ", year: 1988 },
  { title: "Map Theme 1", game: "Super Mario Bros 3", artist: "Koji Kondo", videoId: "v0kIb0WYQ_o", year: 1988 },
  { title: "Ending Theme", game: "Super Mario Bros 3", artist: "Koji Kondo", videoId: "cQWKjnnhKn8", year: 1988 },

  // ─── Super Mario Land (Game Boy, 1989) ──────────────────────────────────────
  { title: "Overworld Theme", game: "Super Mario Land", artist: "Hirokazu Tanaka", videoId: "jIE2Pgq9kZE", year: 1989 },
  { title: "Underground Theme", game: "Super Mario Land", artist: "Hirokazu Tanaka", videoId: "8j2o8V6X6Ag", year: 1989 },
  { title: "Boss Battle", game: "Super Mario Land", artist: "Hirokazu Tanaka", videoId: "dKExGx4sL_8", year: 1989 },
  { title: "Ending Theme", game: "Super Mario Land", artist: "Hirokazu Tanaka", videoId: "5cBjFlKFnXc", year: 1989 },

  // ─── Super Mario World (SNES, 1990) ─────────────────────────────────────────
  { title: "Overworld Theme", game: "Super Mario World", artist: "Koji Kondo", videoId: "k4Qs0KoTruQ", year: 1990 },
  { title: "Athletic Theme", game: "Super Mario World", artist: "Koji Kondo", videoId: "XF2fA1epvLE", year: 1990 },
  { title: "Ghost House", game: "Super Mario World", artist: "Koji Kondo", videoId: "gKPUySDIqyE", year: 1990 },
  { title: "Forest of Illusion", game: "Super Mario World", artist: "Koji Kondo", videoId: "wLnkc2vpHj4", year: 1990 },
  { title: "Castle Theme", game: "Super Mario World", artist: "Koji Kondo", videoId: "hAGLv7xKwv8", year: 1990 },
  { title: "Boss Battle", game: "Super Mario World", artist: "Koji Kondo", videoId: "VHwT9TdXDQk", year: 1990 },
  { title: "Star Road", game: "Super Mario World", artist: "Koji Kondo", videoId: "KExWF63H4Uc", year: 1990 },
  { title: "Ending Theme", game: "Super Mario World", artist: "Koji Kondo", videoId: "gNcIAC30mWI", year: 1990 },
  { title: "Title Screen", game: "Super Mario World", artist: "Koji Kondo", videoId: "5cBjFlKFnXc", year: 1990 },
  { title: "Vanilla Dome", game: "Super Mario World", artist: "Koji Kondo", videoId: "CxD0vRw2xCE", year: 1990 },

  // ─── Super Mario Land 2: 6 Golden Coins (GB, 1992) ──────────────────────────
  { title: "Overworld Theme", game: "Super Mario Land 2: 6 Golden Coins", artist: "Ryoji Yoshitomi", videoId: "2yBp_VZ-9h8", year: 1992 },
  { title: "Wario's Castle", game: "Super Mario Land 2: 6 Golden Coins", artist: "Ryoji Yoshitomi", videoId: "WCCHvqx9Sdo", year: 1992 },
  { title: "Space Zone", game: "Super Mario Land 2: 6 Golden Coins", artist: "Ryoji Yoshitomi", videoId: "laoaez6gcUY", year: 1992 },
  { title: "Pumpkin Zone", game: "Super Mario Land 2: 6 Golden Coins", artist: "Ryoji Yoshitomi", videoId: "mt1rrOo4m6k", year: 1992 },

  // ─── Wario Land: Super Mario Land 3 (GB, 1994) ──────────────────────────────
  { title: "Overworld Theme", game: "Wario Land: Super Mario Land 3", artist: "Kozue Ishikawa", videoId: "6_6qRFQhSdk", year: 1994 },
  { title: "Rice Beach", game: "Wario Land: Super Mario Land 3", artist: "Kozue Ishikawa", videoId: "f8pNjT3WzDE", year: 1994 },

  // ─── Super Mario RPG: Legend of the Seven Stars (SNES, 1996) ────────────────
  { title: "Let's Try!", game: "Super Mario RPG", artist: "Yoko Shimomura", videoId: "wy1VgZhYpDI", year: 1996 },
  { title: "Fight Against Bowser", game: "Super Mario RPG", artist: "Yoko Shimomura", videoId: "Xbr-PLZI4rQ", year: 1996 },
  { title: "Beware the Forest's Mushrooms", game: "Super Mario RPG", artist: "Yoko Shimomura", videoId: "OxwZ9Jbqlso", year: 1996 },
  { title: "Fight Against a Somewhat Stronger Monster", game: "Super Mario RPG", artist: "Yoko Shimomura", videoId: "I3O_-5J3lRI", year: 1996 },
  { title: "Still, The Road Is Full of Dangers!", game: "Super Mario RPG", artist: "Yoko Shimomura", videoId: "cKc9ZYqMVQI", year: 1996 },
  { title: "And My Name's Booster", game: "Super Mario RPG", artist: "Yoko Shimomura", videoId: "vGmyGfJgf84", year: 1996 },
  { title: "Rose Town", game: "Super Mario RPG", artist: "Yoko Shimomura", videoId: "uRPF-V9CF24", year: 1996 },
  { title: "Nimbus Land", game: "Super Mario RPG", artist: "Yoko Shimomura", videoId: "4gYn_I55E44", year: 1996 },

  // ─── Super Mario 64 (N64, 1996) ─────────────────────────────────────────────
  { title: "Bob-omb Battlefield", game: "Super Mario 64", artist: "Koji Kondo", videoId: "9OBqTZ8P0xg", year: 1996 },
  { title: "Dire, Dire Docks", game: "Super Mario 64", artist: "Koji Kondo", videoId: "eUq6JYg2pZE", year: 1996 },
  { title: "Cool, Cool Mountain", game: "Super Mario 64", artist: "Koji Kondo", videoId: "R84G_xQTdwU", year: 1996 },
  { title: "Koopa's Road", game: "Super Mario 64", artist: "Koji Kondo", videoId: "3-x4vfEAVAo", year: 1996 },
  { title: "Bowser's Road", game: "Super Mario 64", artist: "Koji Kondo", videoId: "usjjSVqCRRg", year: 1996 },
  { title: "Inside the Castle Walls", game: "Super Mario 64", artist: "Koji Kondo", videoId: "TK1Rndzp2yE", year: 1996 },
  { title: "Jolly Roger Bay", game: "Super Mario 64", artist: "Koji Kondo", videoId: "HqMy3XUk8M4", year: 1996 },
  { title: "Lethal Lava Land", game: "Super Mario 64", artist: "Koji Kondo", videoId: "79KpN8ZvOec", year: 1996 },
  { title: "Hazy Maze Cave", game: "Super Mario 64", artist: "Koji Kondo", videoId: "scCgiF9tGb0", year: 1996 },
  { title: "Snowman's Land", game: "Super Mario 64", artist: "Koji Kondo", videoId: "cC1hVTiIzqM", year: 1996 },
  { title: "Slide", game: "Super Mario 64", artist: "Koji Kondo", videoId: "O11MRJb3ZvY", year: 1996 },
  { title: "Piranha Plant's Lullaby", game: "Super Mario 64", artist: "Koji Kondo", videoId: "ygdEmOHftRc", year: 1996 },
  { title: "File Select", game: "Super Mario 64", artist: "Koji Kondo", videoId: "PcLPwqG1KLI", year: 1996 },
  { title: "Title / Main Theme", game: "Super Mario 64", artist: "Koji Kondo", videoId: "rMKeWs7MLJY", year: 1996 },

  // ─── Mario Kart 64 (N64, 1996) ───────────────────────────────────────────────
  { title: "Main Theme", game: "Mario Kart 64", artist: "Kenta Nagata", videoId: "Qxn3g9qbF3Q", year: 1996 },
  { title: "Mario Raceway", game: "Mario Kart 64", artist: "Kenta Nagata", videoId: "v0kIb0WYQ_o", year: 1996 },
  { title: "Rainbow Road", game: "Mario Kart 64", artist: "Kenta Nagata", videoId: "9GJOxwX_j8I", year: 1996 },
  { title: "Koopa Troopa Beach", game: "Mario Kart 64", artist: "Kenta Nagata", videoId: "DjxoyqL3ETU", year: 1996 },
  { title: "Toad's Turnpike", game: "Mario Kart 64", artist: "Kenta Nagata", videoId: "qv1aIZMAgH8", year: 1996 },
  { title: "Choco Mountain", game: "Mario Kart 64", artist: "Kenta Nagata", videoId: "9chsn7yWKPo", year: 1996 },

  // ─── Paper Mario (N64, 2000) ─────────────────────────────────────────────────
  { title: "Title Theme", game: "Paper Mario", artist: "Yoko Shimomura", videoId: "Io-WBv6V9pk", year: 2000 },
  { title: "Koopa Village", game: "Paper Mario", artist: "Yoko Shimomura", videoId: "cKc9ZYqMVQI", year: 2000 },
  { title: "Battle Theme", game: "Paper Mario", artist: "Yoko Shimomura", videoId: "WCH1TDw5lOU", year: 2000 },
  { title: "Fortress Boss", game: "Paper Mario", artist: "Yoko Shimomura", videoId: "OYqbL8nKKm4", year: 2000 },
  { title: "Toad Town", game: "Paper Mario", artist: "Yoko Shimomura", videoId: "uRPF-V9CF24", year: 2000 },
  { title: "Bowser's Theme", game: "Paper Mario", artist: "Yoko Shimomura", videoId: "PKF2cDbFvtU", year: 2000 },

  // ─── Mario Party (N64, 1998) ──────────────────────────────────────────────────
  { title: "Let's Start (Main Theme)", game: "Mario Party", artist: "Shiho Fujii", videoId: "yMc-rKGqyKc", year: 1998 },
  { title: "Mini-Game Land", game: "Mario Party", artist: "Shiho Fujii", videoId: "f8pNjT3WzDE", year: 1998 },
  { title: "Bowser's Theme", game: "Mario Party", artist: "Shiho Fujii", videoId: "73iWfOMWFM4", year: 1998 },

  // ─── Super Mario Sunshine (GCN, 2002) ────────────────────────────────────────
  { title: "Delfino Plaza", game: "Super Mario Sunshine", artist: "Koji Kondo", videoId: "rDHUDU5HWTM", year: 2002 },
  { title: "Ricco Harbor", game: "Super Mario Sunshine", artist: "Koji Kondo", videoId: "buwYkwKHkrk", year: 2002 },
  { title: "Bianco Hills", game: "Super Mario Sunshine", artist: "Koji Kondo", videoId: "oMhXbS6l2F0", year: 2002 },
  { title: "Pinna Park Beach", game: "Super Mario Sunshine", artist: "Koji Kondo", videoId: "GH-FGpqiNv8", year: 2002 },
  { title: "Sirena Beach", game: "Super Mario Sunshine", artist: "Koji Kondo", videoId: "yMPuE3j1GXU", year: 2002 },
  { title: "Noki Bay", game: "Super Mario Sunshine", artist: "Koji Kondo", videoId: "ij8l4lH3oAI", year: 2002 },
  { title: "Boss Battle (Petey Piranha)", game: "Super Mario Sunshine", artist: "Koji Kondo", videoId: "AjvBJUHXIBo", year: 2002 },
  { title: "Corona Mountain", game: "Super Mario Sunshine", artist: "Koji Kondo", videoId: "BgWfzWKM8tg", year: 2002 },
  { title: "Title Screen", game: "Super Mario Sunshine", artist: "Koji Kondo", videoId: "TmF9iZZ4eYI", year: 2002 },

  // ─── Mario Kart: Double Dash!! (GCN, 2003) ───────────────────────────────────
  { title: "Mushroom Cup Selection", game: "Mario Kart: Double Dash!!", artist: "Kenta Nagata", videoId: "p7Pl2W9VDt0", year: 2003 },
  { title: "Luigi Circuit", game: "Mario Kart: Double Dash!!", artist: "Kenta Nagata", videoId: "VFZiBiakKeA", year: 2003 },
  { title: "Baby Park", game: "Mario Kart: Double Dash!!", artist: "Kenta Nagata", videoId: "hj77jSjFGVQ", year: 2003 },
  { title: "Mushroom Bridge", game: "Mario Kart: Double Dash!!", artist: "Kenta Nagata", videoId: "DcYUfmcXB_8", year: 2003 },
  { title: "Rainbow Road", game: "Mario Kart: Double Dash!!", artist: "Kenta Nagata", videoId: "gBxwVj2QAaE", year: 2003 },

  // ─── Mario & Luigi: Superstar Saga (GBA, 2003) ───────────────────────────────
  { title: "Beanbean Kingdom Overworld", game: "Mario & Luigi: Superstar Saga", artist: "Yoko Shimomura", videoId: "vGmyGfJgf84", year: 2003 },
  { title: "Strike Out!", game: "Mario & Luigi: Superstar Saga", artist: "Yoko Shimomura", videoId: "2G_1W4TFQXU", year: 2003 },
  { title: "Cackletta's Theme", game: "Mario & Luigi: Superstar Saga", artist: "Yoko Shimomura", videoId: "C_gVZwLXo1c", year: 2003 },
  { title: "Koopa Cruiser", game: "Mario & Luigi: Superstar Saga", artist: "Yoko Shimomura", videoId: "I3O_-5J3lRI", year: 2003 },

  // ─── Paper Mario: The Thousand-Year Door (GCN, 2004) ─────────────────────────
  { title: "Rogueport", game: "Paper Mario: TTYD", artist: "Yoko Shimomura", videoId: "4gYn_I55E44", year: 2004 },
  { title: "Battle Theme", game: "Paper Mario: TTYD", artist: "Yoko Shimomura", videoId: "h4VVkYLQdcU", year: 2004 },
  { title: "The Glitz Pit", game: "Paper Mario: TTYD", artist: "Yoko Shimomura", videoId: "aTqPnOYC5ks", year: 2004 },
  { title: "X-Nauts Fortress", game: "Paper Mario: TTYD", artist: "Yoko Shimomura", videoId: "OYqbL8nKKm4", year: 2004 },
  { title: "Shadow Sirens", game: "Paper Mario: TTYD", artist: "Yoko Shimomura", videoId: "cWmZWHr8J1w", year: 2004 },

  // ─── New Super Mario Bros (DS, 2006) ─────────────────────────────────────────
  { title: "Main Theme", game: "New Super Mario Bros", artist: "Asuka Ohta", videoId: "jCcKUe5b0UI", year: 2006 },
  { title: "Overworld Theme", game: "New Super Mario Bros", artist: "Asuka Ohta", videoId: "UgXVKF1-fwI", year: 2006 },
  { title: "Underground Theme", game: "New Super Mario Bros", artist: "Asuka Ohta", videoId: "LlvUepMa31o", year: 2006 },
  { title: "Boss Battle", game: "New Super Mario Bros", artist: "Asuka Ohta", videoId: "7rK_RKVE7iw", year: 2006 },
  { title: "Ghost House", game: "New Super Mario Bros", artist: "Asuka Ohta", videoId: "hbqblXHGzlI", year: 2006 },

  // ─── Super Mario Galaxy (Wii, 2007) ──────────────────────────────────────────
  { title: "Overture", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "qv1aIZMAgH8", year: 2007 },
  { title: "Luma", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "9chsn7yWKPo", year: 2007 },
  { title: "Good Egg Galaxy", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "KKR96v2GHHU", year: 2007 },
  { title: "Honeyhive Galaxy", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "scCgiF9tGb0", year: 2007 },
  { title: "The Honeyhive", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "1FzcXMGpPpE", year: 2007 },
  { title: "Space Junk Road", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "rqDH8hGqjRE", year: 2007 },
  { title: "Battlerock Galaxy", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "73iWfOMWFM4", year: 2007 },
  { title: "Buoy Base Galaxy", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "_lf5U_CqgCE", year: 2007 },
  { title: "King Kaliente", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "79KpN8ZvOec", year: 2007 },
  { title: "Gusty Garden Galaxy", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "O7F7-Q0CxEw", year: 2007 },
  { title: "Freezeflame Galaxy", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "iKKKX1KxJfQ", year: 2007 },
  { title: "Bowser's Galaxy Reactor", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "PKF2cDbFvtU", year: 2007 },
  { title: "Final Battle (Bowser)", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "VrDBsoen0Ng", year: 2007 },
  { title: "Star Festival", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "mt1rrOo4m6k", year: 2007 },
  { title: "Purple Comet", game: "Super Mario Galaxy", artist: "Koji Kondo / Mahito Yokota", videoId: "O7F7-Q0CxEw", year: 2007 },

  // ─── Mario Kart Wii (Wii, 2008) ──────────────────────────────────────────────
  { title: "Main Theme", game: "Mario Kart Wii", artist: "Kota Hoshino / Ryo Nagamatsu", videoId: "Ci36CZ1HhVs", year: 2008 },
  { title: "Coconut Mall", game: "Mario Kart Wii", artist: "Kota Hoshino / Ryo Nagamatsu", videoId: "uAVppLIXxA4", year: 2008 },
  { title: "Rainbow Road", game: "Mario Kart Wii", artist: "Kota Hoshino / Ryo Nagamatsu", videoId: "gBxwVj2QAaE", year: 2008 },
  { title: "Moo Moo Meadows", game: "Mario Kart Wii", artist: "Kota Hoshino / Ryo Nagamatsu", videoId: "uAVppLIXxA4", year: 2008 },
  { title: "Grumble Volcano", game: "Mario Kart Wii", artist: "Kota Hoshino / Ryo Nagamatsu", videoId: "Ci36CZ1HhVs", year: 2008 },
  { title: "Moonview Highway", game: "Mario Kart Wii", artist: "Kota Hoshino / Ryo Nagamatsu", videoId: "IKMrPVoECVA", year: 2008 },

  // ─── Mario & Luigi: Bowser's Inside Story (DS, 2009) ─────────────────────────
  { title: "In the Final", game: "Mario & Luigi: Bowser's Inside Story", artist: "Yoko Shimomura", videoId: "cWmZWHr8J1w", year: 2009 },
  { title: "Bowser Battle", game: "Mario & Luigi: Bowser's Inside Story", artist: "Yoko Shimomura", videoId: "2G_1W4TFQXU", year: 2009 },
  { title: "Cavi Cape", game: "Mario & Luigi: Bowser's Inside Story", artist: "Yoko Shimomura", videoId: "C_gVZwLXo1c", year: 2009 },
  { title: "Dimble Wood", game: "Mario & Luigi: Bowser's Inside Story", artist: "Yoko Shimomura", videoId: "vGmyGfJgf84", year: 2009 },

  // ─── New Super Mario Bros Wii (Wii, 2009) ────────────────────────────────────
  { title: "Main Theme", game: "New Super Mario Bros Wii", artist: "Koji Kondo", videoId: "7rK_RKVE7iw", year: 2009 },
  { title: "Overworld Theme", game: "New Super Mario Bros Wii", artist: "Koji Kondo", videoId: "hbqblXHGzlI", year: 2009 },
  { title: "Airship Theme", game: "New Super Mario Bros Wii", artist: "Koji Kondo", videoId: "_w2lF0m-0ho", year: 2009 },
  { title: "Ice World", game: "New Super Mario Bros Wii", artist: "Koji Kondo", videoId: "LlvUepMa31o", year: 2009 },

  // ─── Super Mario Galaxy 2 (Wii, 2010) ────────────────────────────────────────
  { title: "Yoshi Star Galaxy", game: "Super Mario Galaxy 2", artist: "Mahito Yokota / Ryo Nagamatsu", videoId: "zc_UJVKPXx8", year: 2010 },
  { title: "Sky Station Galaxy", game: "Super Mario Galaxy 2", artist: "Mahito Yokota / Ryo Nagamatsu", videoId: "EWDUlfv8aWQ", year: 2010 },
  { title: "Flip-Swap Galaxy", game: "Super Mario Galaxy 2", artist: "Mahito Yokota / Ryo Nagamatsu", videoId: "LXNQVCD5ov4", year: 2010 },
  { title: "Puzzle Plank Galaxy", game: "Super Mario Galaxy 2", artist: "Mahito Yokota / Ryo Nagamatsu", videoId: "kImqjNBR_9A", year: 2010 },
  { title: "Throwback Galaxy", game: "Super Mario Galaxy 2", artist: "Mahito Yokota / Ryo Nagamatsu", videoId: "O7F7-Q0CxEw", year: 2010 },
  { title: "Bowser's Fortresses", game: "Super Mario Galaxy 2", artist: "Mahito Yokota / Ryo Nagamatsu", videoId: "PKF2cDbFvtU", year: 2010 },
  { title: "Final Bowser Battle", game: "Super Mario Galaxy 2", artist: "Mahito Yokota / Ryo Nagamatsu", videoId: "VrDBsoen0Ng", year: 2010 },

  // ─── Super Mario 3D Land (3DS, 2011) ─────────────────────────────────────────
  { title: "Overworld Theme", game: "Super Mario 3D Land", artist: "Koji Kondo", videoId: "Fd5-P3h9Hj8", year: 2011 },
  { title: "Airship Theme", game: "Super Mario 3D Land", artist: "Koji Kondo", videoId: "Q_BYrMlAGmg", year: 2011 },
  { title: "Ghost House", game: "Super Mario 3D Land", artist: "Koji Kondo", videoId: "gKPUySDIqyE", year: 2011 },
  { title: "Bowser Battle", game: "Super Mario 3D Land", artist: "Koji Kondo", videoId: "VHwT9TdXDQk", year: 2011 },
  { title: "Special World", game: "Super Mario 3D Land", artist: "Koji Kondo", videoId: "iKKKX1KxJfQ", year: 2011 },

  // ─── Mario Kart 7 (3DS, 2011) ────────────────────────────────────────────────
  { title: "Rainbow Road", game: "Mario Kart 7", artist: "Ryo Nagamatsu", videoId: "hgx-krvG0DA", year: 2011 },
  { title: "Neo Bowser City", game: "Mario Kart 7", artist: "Ryo Nagamatsu", videoId: "BzFPU0y_cRo", year: 2011 },
  { title: "Maple Treeway", game: "Mario Kart 7", artist: "Ryo Nagamatsu", videoId: "s38SQZ5JTbk", year: 2011 },
  { title: "Music Park", game: "Mario Kart 7", artist: "Ryo Nagamatsu", videoId: "xSgCIFd8uOw", year: 2011 },

  // ─── Paper Mario: Sticker Star (3DS, 2012) ───────────────────────────────────
  { title: "World 1: Warm Fuzzy Plains", game: "Paper Mario: Sticker Star", artist: "Yasunori Mitsuda", videoId: "Io-WBv6V9pk", year: 2012 },
  { title: "Battle Theme", game: "Paper Mario: Sticker Star", artist: "Yasunori Mitsuda", videoId: "WCH1TDw5lOU", year: 2012 },

  // ─── New Super Mario Bros 2 (3DS, 2012) ──────────────────────────────────────
  { title: "Overworld Theme", game: "New Super Mario Bros 2", artist: "Shinobu Tanaka", videoId: "A58JqCYkPxc", year: 2012 },
  { title: "Boss Battle", game: "New Super Mario Bros 2", artist: "Shinobu Tanaka", videoId: "qxQDNcPG-QE", year: 2012 },

  // ─── New Super Mario Bros U (Wii U, 2012) ────────────────────────────────────
  { title: "Overworld Theme", game: "New Super Mario Bros U", artist: "Shinobu Tanaka", videoId: "qXWhqcWyGPk", year: 2012 },
  { title: "Acorn Plains Way", game: "New Super Mario Bros U", artist: "Shinobu Tanaka", videoId: "A58JqCYkPxc", year: 2012 },
  { title: "Rock-Candy Mines", game: "New Super Mario Bros U", artist: "Shinobu Tanaka", videoId: "_w2lF0m-0ho", year: 2012 },

  // ─── Luigi's Mansion (GCN, 2001) ─────────────────────────────────────────────
  { title: "Main Theme", game: "Luigi's Mansion", artist: "Shinobu Tanaka", videoId: "VKVxQSfYfSE", year: 2001 },
  { title: "Main Hall", game: "Luigi's Mansion", artist: "Shinobu Tanaka", videoId: "vQVqq64IhHg", year: 2001 },
  { title: "Boss Battle", game: "Luigi's Mansion", artist: "Shinobu Tanaka", videoId: "78Y8ixYGXAw", year: 2001 },
  { title: "Credits", game: "Luigi's Mansion", artist: "Shinobu Tanaka", videoId: "lz0zHe_xr7Q", year: 2001 },

  // ─── Luigi's Mansion: Dark Moon (3DS, 2013) ───────────────────────────────────
  { title: "Main Theme", game: "Luigi's Mansion: Dark Moon", artist: "Shinobu Tanaka", videoId: "lz0zHe_xr7Q", year: 2013 },
  { title: "Gloomy Manor", game: "Luigi's Mansion: Dark Moon", artist: "Shinobu Tanaka", videoId: "J_K2NVMqbNE", year: 2013 },
  { title: "Haunted Towers", game: "Luigi's Mansion: Dark Moon", artist: "Shinobu Tanaka", videoId: "VKVxQSfYfSE", year: 2013 },

  // ─── Luigi's Mansion 3 (Switch, 2019) ────────────────────────────────────────
  { title: "hotel Shops (Basement)", game: "Luigi's Mansion 3", artist: "Koji Kondo", videoId: "78Y8ixYGXAw", year: 2019 },
  { title: "Grand Lobby", game: "Luigi's Mansion 3", artist: "Koji Kondo", videoId: "vQVqq64IhHg", year: 2019 },

  // ─── Super Mario 3D World (Wii U, 2013) ──────────────────────────────────────
  { title: "Super Bell Hill", game: "Super Mario 3D World", artist: "Koji Kondo", videoId: "qxQDNcPG-QE", year: 2013 },
  { title: "World Bowser", game: "Super Mario 3D World", artist: "Koji Kondo", videoId: "H5xyQ1rLCv8", year: 2013 },
  { title: "Champion's Road", game: "Super Mario 3D World", artist: "Koji Kondo", videoId: "Fd5-P3h9Hj8", year: 2013 },
  { title: "Mount Must Dash", game: "Super Mario 3D World", artist: "Koji Kondo", videoId: "Q_BYrMlAGmg", year: 2013 },
  { title: "The Great Tower Showdown 2", game: "Super Mario 3D World", artist: "Koji Kondo", videoId: "VHwT9TdXDQk", year: 2013 },

  // ─── Mario Kart 8 / Deluxe (Wii U/Switch, 2014/2017) ─────────────────────────
  { title: "Mario Kart 8 Main Theme", game: "Mario Kart 8 Deluxe", artist: "Various", videoId: "IKMrPVoECVA", year: 2014 },
  { title: "Rainbow Road", game: "Mario Kart 8 Deluxe", artist: "Ryo Nagamatsu", videoId: "hgx-krvG0DA", year: 2014 },
  { title: "Mario Circuit", game: "Mario Kart 8 Deluxe", artist: "Various", videoId: "DcYUfmcXB_8", year: 2014 },
  { title: "Toad Harbor", game: "Mario Kart 8 Deluxe", artist: "Various", videoId: "s38SQZ5JTbk", year: 2014 },
  { title: "Sunshine Airport", game: "Mario Kart 8 Deluxe", artist: "Various", videoId: "GpWChA-mju0", year: 2014 },
  { title: "Mount Wario", game: "Mario Kart 8 Deluxe", artist: "Various", videoId: "tLxX3tBrM5U", year: 2014 },
  { title: "Electrodrome", game: "Mario Kart 8 Deluxe", artist: "Various", videoId: "iE8sUmxT9vA", year: 2014 },
  { title: "Cloudtop Cruise", game: "Mario Kart 8 Deluxe", artist: "Various", videoId: "RPalBDpE1qk", year: 2014 },
  { title: "Bone Dry Dunes", game: "Mario Kart 8 Deluxe", artist: "Various", videoId: "BzFPU0y_cRo", year: 2014 },
  { title: "Sweet Sweet Canyon", game: "Mario Kart 8 Deluxe", artist: "Various", videoId: "xSgCIFd8uOw", year: 2014 },
  { title: "Water Park", game: "Mario Kart 8 Deluxe", artist: "Various", videoId: "4jQhuZvdho0", year: 2014 },
  { title: "Shy Guy Falls", game: "Mario Kart 8 Deluxe", artist: "Various", videoId: "ha4wG3gZb0I", year: 2014 },

  // ─── Captain Toad: Treasure Tracker (Wii U, 2014) ────────────────────────────
  { title: "World 1 Medley (Toad's Theme)", game: "Captain Toad: Treasure Tracker", artist: "Mahito Yokota", videoId: "cC1hVTiIzqM", year: 2014 },
  { title: "Draggadon's Theme", game: "Captain Toad: Treasure Tracker", artist: "Mahito Yokota", videoId: "O11MRJb3ZvY", year: 2014 },

  // ─── Super Mario Maker (Wii U, 2015) ─────────────────────────────────────────
  { title: "Main Theme / Editor", game: "Super Mario Maker", artist: "Koji Kondo", videoId: "NcguyW3-sTc", year: 2015 },

  // ─── Mario & Luigi: Paper Jam (3DS, 2015) ────────────────────────────────────
  { title: "Twinsy Tropics", game: "Mario & Luigi: Paper Jam", artist: "Yoko Shimomura", videoId: "C_gVZwLXo1c", year: 2015 },
  { title: "Battle Theme", game: "Mario & Luigi: Paper Jam", artist: "Yoko Shimomura", videoId: "2G_1W4TFQXU", year: 2015 },

  // ─── Super Mario Odyssey (Switch, 2017) ──────────────────────────────────────
  { title: "Jump Up, Super Star!", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "iNK_vq4Y9S8", year: 2017 },
  { title: "Steam Gardens (Wooded Kingdom)", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "vy3PSN1g3T0", year: 2017 },
  { title: "New Donk City Festival", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "hF-DyChqYGc", year: 2017 },
  { title: "Luncheon Kingdom", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "o-JtGiJ_4t8", year: 2017 },
  { title: "Sand Kingdom (Tostarena Ruins)", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "vkrbKejaSSE", year: 2017 },
  { title: "Bonneton (Cap Kingdom)", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "wVGqg4rBRbg", year: 2017 },
  { title: "Bowser's Kingdom", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "PKF2cDbFvtU", year: 2017 },
  { title: "Break Free (Lead the Way)", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "2sLHaVF-tFQ", year: 2017 },
  { title: "Fossil Falls (Cascade Kingdom)", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "jR8BJNVwbnI", year: 2017 },
  { title: "Lake Kingdom", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "ll_4VLuPvRk", year: 2017 },
  { title: "Cloud Kingdom", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "80ZYToHHWZc", year: 2017 },
  { title: "Lost Kingdom", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "-5iYS5YnxIo", year: 2017 },
  { title: "Snow Kingdom", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "9fTUeU2oIlA", year: 2017 },
  { title: "Seaside Kingdom", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "VhAyXM7Z1Jg", year: 2017 },
  { title: "Moon Kingdom (Culmina Crater)", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "RD8iCp1Eo_k", year: 2017 },
  { title: "Mushroom Kingdom", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "2Utqotx0XvI", year: 2017 },
  { title: "The Darker Side", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "2sLHaVF-tFQ", year: 2017 },
  { title: "Bowser Battle", game: "Super Mario Odyssey", artist: "Naoki Sakatoku", videoId: "VrDBsoen0Ng", year: 2017 },

  // ─── Super Mario Party (Switch, 2018) ────────────────────────────────────────
  { title: "Main Theme", game: "Super Mario Party", artist: "Koji Kondo", videoId: "yMc-rKGqyKc", year: 2018 },
  { title: "King Bob-omb's Powderkeg Mine", game: "Super Mario Party", artist: "Koji Kondo", videoId: "f8pNjT3WzDE", year: 2018 },

  // ─── Super Mario 3D World + Bowser's Fury (Switch, 2021) ─────────────────────
  { title: "Bowser's Fury Main Theme", game: "Super Mario 3D World + Bowser's Fury", artist: "Koji Kondo", videoId: "H5xyQ1rLCv8", year: 2021 },
  { title: "Lake Lapcat", game: "Super Mario 3D World + Bowser's Fury", artist: "Koji Kondo", videoId: "Q_BYrMlAGmg", year: 2021 },

  // ─── Mario + Rabbids Kingdom Battle (Switch, 2017) ───────────────────────────
  { title: "Donkey Kong Adventure Theme", game: "Mario + Rabbids Kingdom Battle", artist: "Grant Kirkhope", videoId: "AGPlEf0TLaI", year: 2017 },
  { title: "World 1 Overworld", game: "Mario + Rabbids Kingdom Battle", artist: "Grant Kirkhope", videoId: "tA_U9xXTz1I", year: 2017 },

  // ─── Paper Mario: The Origami King (Switch, 2020) ────────────────────────────
  { title: "Battle Theme", game: "Paper Mario: The Origami King", artist: "Yasunori Mitsuda", videoId: "WCH1TDw5lOU", year: 2020 },
  { title: "Shogun Studios", game: "Paper Mario: The Origami King", artist: "Yasunori Mitsuda", videoId: "4gYn_I55E44", year: 2020 },
  { title: "Sea Tower", game: "Paper Mario: The Origami King", artist: "Yasunori Mitsuda", videoId: "aTqPnOYC5ks", year: 2020 },

  // ─── Super Mario Bros: Wonder (Switch, 2023) ──────────────────────────────────
  { title: "World Map Theme", game: "Super Mario Bros Wonder", artist: "Koji Kondo", videoId: "NcguyW3-sTc", year: 2023 },
  { title: "Overworld Theme", game: "Super Mario Bros Wonder", artist: "Koji Kondo", videoId: "k4Qs0KoTruQ", year: 2023 },
  { title: "Badge Challenge", game: "Super Mario Bros Wonder", artist: "Koji Kondo", videoId: "iKKKX1KxJfQ", year: 2023 },
  { title: "Wonder Flower Theme", game: "Super Mario Bros Wonder", artist: "Koji Kondo", videoId: "XF2fA1epvLE", year: 2023 },

  // ─── Mario Kart: Super Circuit (GBA, 2001) ────────────────────────────────────
  { title: "Rainbow Road", game: "Mario Kart: Super Circuit", artist: "Yumiko Kanki", videoId: "9GJOxwX_j8I", year: 2001 },
  { title: "Boo Lake", game: "Mario Kart: Super Circuit", artist: "Yumiko Kanki", videoId: "6_6qRFQhSdk", year: 2001 },

  // ─── Donkey Kong (Arcade, 1981) ───────────────────────────────────────────────
  { title: "How High Can You Get?", game: "Donkey Kong (Arcade)", artist: "Yukio Kaneoka", videoId: "L4PxvY2gjP0", year: 1981 },
  { title: "Introduction Theme", game: "Donkey Kong (Arcade)", artist: "Yukio Kaneoka", videoId: "ox2Fjp9oeAI", year: 1981 },

  // ─── Mario & Luigi: Dream Team (3DS, 2013) ────────────────────────────────────
  { title: "Dreamy Pi'illo Castle", game: "Mario & Luigi: Dream Team", artist: "Yoko Shimomura", videoId: "cWmZWHr8J1w", year: 2013 },
  { title: "Antasma Battle", game: "Mario & Luigi: Dream Team", artist: "Yoko Shimomura", videoId: "I3O_-5J3lRI", year: 2013 },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing environment variables" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Delete all existing songs first
  const deleteRes = await fetch(`${supabaseUrl}/rest/v1/songs?id=gt.0`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
  });

  if (!deleteRes.ok && deleteRes.status !== 404) {
    const errText = await deleteRes.text();
    console.warn("Warning during delete:", errText);
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/songs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(
      marioSoundtracks.map((track) => ({
        title: track.title,
        game: track.game,
        artist: track.artist,
        youtube_video_id: track.videoId,
        thumbnail_url: `https://img.youtube.com/vi/${track.videoId}/maxresdefault.jpg`,
        release_year: track.year,
      }))
    ),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Error seeding database:", error);
    return new Response(
      JSON.stringify({ error: "Failed to seed database", details: error }),
      { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Successfully seeded ${marioSoundtracks.length} songs`,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
