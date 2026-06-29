#!/usr/bin/env node
"use strict";

// CR-Track skill installer.
// Copies the bundled skill into a target Claude Code skills directory so it can
// be picked up by Claude Code. Runs with zero dependencies on Node >=16.
//
//   npx cr-track-skill            install into ./.claude/skills/cr-track
//   npx cr-track-skill --global   install into ~/.claude/skills/cr-track
//   npx cr-track-skill --force    overwrite an existing install
//   npx cr-track-skill --help     usage

const fs = require("fs");
const os = require("os");
const path = require("path");

const PKG = require(path.join(__dirname, "..", "package.json"));
const SKILL_SRC = path.join(__dirname, "..", "skill");
const SKILL_NAME = "cr-track";

function parseArgs(argv) {
  const opts = { global: false, force: false, help: false };
  for (const a of argv) {
    if (a === "--global" || a === "-g") opts.global = true;
    else if (a === "--force" || a === "-f") opts.force = true;
    else if (a === "--help" || a === "-h") opts.help = true;
    else if (a === "init" || a === "install") continue; // optional verb
    else {
      console.error(`cr-track-skill: unknown argument "${a}"`);
      opts.help = true;
    }
  }
  return opts;
}

function printHelp() {
  console.log(`
cr-track-skill v${PKG.version} — install the CR-Track review skill for Claude Code

Usage:
  npx cr-track-skill [options]

Options:
  -g, --global   Install into ~/.claude/skills/cr-track (available in every repo)
  -f, --force    Overwrite an existing cr-track skill install
  -h, --help     Show this help

Default target is ./.claude/skills/cr-track in the current directory.

After installing:
  1. Stage changes:  git add .
  2. In Claude Code: "review my staged changes"
`);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    // Bundle ships the config sample as cr-track.yaml.example (no leading dot,
    // so npm always includes it); leave it under that name in references is N/A
    // — it lives at skill root and is written out as-is.
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const baseDir = opts.global ? os.homedir() : process.cwd();
  const skillsRoot = path.join(baseDir, ".claude", "skills");
  const dest = path.join(skillsRoot, SKILL_NAME);

  if (fs.existsSync(dest) && !opts.force) {
    console.error(
      `\ncr-track-skill: "${dest}" already exists.\n` +
        `Re-run with --force to overwrite it.\n`
    );
    process.exit(1);
  }

  try {
    if (fs.existsSync(dest) && opts.force) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    copyDir(SKILL_SRC, dest);
  } catch (err) {
    console.error(`\ncr-track-skill: install failed — ${err.message}\n`);
    process.exit(1);
  }

  const where = opts.global ? "~/.claude/skills" : "./.claude/skills";
  console.log(`
✓ CR-Track skill installed to ${where}/${SKILL_NAME}

Next:
  1. (optional) copy the config sample to your repo root:
       cp ${where}/${SKILL_NAME}/cr-track.yaml.example .cr-track.yaml
  2. Stage some changes:   git add .
  3. In Claude Code, say:  "review my staged changes"
`);
}

main();
