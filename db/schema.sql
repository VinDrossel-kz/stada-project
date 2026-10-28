-- Idempotent schema: safe to run on every start.

CREATE TABLE IF NOT EXISTS teams (
  id integer PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
  id serial PRIMARY KEY,
  team_id integer NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id integer PRIMARY KEY,
  stage text NOT NULL,
  name text NOT NULL,
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS organizers (
  id serial PRIMARY KEY,
  login text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'judge')),
  password_hash text NOT NULL,
  -- Bumped on password change or removal: invalidates every issued session.
  session_version integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scores (
  team_id integer NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  game_id integer NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by integer REFERENCES organizers(id) ON DELETE SET NULL,
  PRIMARY KEY (team_id, game_id)
);

-- Every score change, including reverts. Organizer name is copied so history survives account removal.
CREATE TABLE IF NOT EXISTS score_log (
  id serial PRIMARY KEY,
  team_id integer NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  game_id integer NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  old_score integer NOT NULL,
  new_score integer NOT NULL,
  organizer_id integer REFERENCES organizers(id) ON DELETE SET NULL,
  organizer_name text NOT NULL,
  reverts_id integer REFERENCES score_log(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS score_log_created_at ON score_log (created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL
);
