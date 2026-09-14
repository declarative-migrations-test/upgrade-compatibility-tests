import assert from 'node:assert/strict';
import test from 'node:test';

const SHA = '5dbda2127357b4be87821902d36e4ce9560f6876';
const BASE = `https://raw.githubusercontent.com/ORESoftware/ores-interfaces/${SHA}/contracts/ores-compose-machine/v1`;
const response = await fetch(`${BASE}/authored.schema.json`);
assert.equal(response.status, 200);
const schema = await response.json();
const defs = schema.$defs;

test('v1 schema identity remains exact for compatibility negotiation', () => {
  assert.equal(schema.$id, 'https://schemas.oresoftware.com/compose/machine/v1.json');
  for (const model of ['EnsureRequest','EnqueueResponse','JobStatusResponse','ReadinessResponse','MachineErrorResponse']) {
    assert.equal(defs[model].properties.schema_version.const, 'ores.compose.machine.v1');
  }
});

test('v1 EnsureRequest required field set remains stable', () => {
  assert.deepEqual(defs.EnsureRequest.required, ['schema_version','project','session','service','revision','rebuild']);
  assert.deepEqual(Object.keys(defs.EnsureRequest.properties).sort(), ['schema_version','project','session','service','revision','rebuild'].sort());
});

test('revision grammar stays identical between requested and active revisions', () => {
  assert.equal(defs.EnsureRequest.properties.revision.pattern, defs.ActiveSystem.properties.revision.pattern);
  assert.equal(defs.EnsureRequest.properties.revision.maxLength, defs.ActiveSystem.properties.revision.maxLength);
});

test('v1 optional fields stay optional and never become explicit-null requirements', () => {
  assert.equal(defs.ActiveSystem.required.includes('ingress'), false);
  assert.equal(defs.JobStatusResponse.required.includes('active'), false);
  assert.equal(defs.ReadinessResponse.required.includes('active'), false);
  assert.equal(defs.MachineErrorResponse.required.includes('job_id'), false);
  assert.equal(defs.JobStatusResponse.properties.active.$ref, '#/$defs/ActiveSystem');
});

test('v1 numeric identities remain decimal strings and state vocabularies remain closed', () => {
  assert.equal(defs.EnqueueResponse.properties.job_id.type, 'string');
  assert.equal(defs.JobStatusResponse.properties.job_id.type, 'string');
  assert.equal(defs.ActiveSystem.properties.generation.type, 'string');
  assert.deepEqual(defs.EnqueueResponse.properties.state.anyOf.map((x) => x.const), ['queued','running']);
  assert.deepEqual(defs.JobStatusResponse.properties.state.anyOf.map((x) => x.const), ['queued','running','ready','failed']);
});
