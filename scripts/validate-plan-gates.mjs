import fs from 'node:fs';

const plan = JSON.parse(fs.readFileSync('project-plan.json', 'utf8'));
const errors = [];

for (const step of plan.steps) {
  const pre = step.gates?.preImplementation;
  const post = step.gates?.postImplementation;
  if (!pre || !post) errors.push(`${step.id}: gates ausentes`);
  if (step.status === 'completed') {
    if (pre?.status !== 'completed') errors.push(`${step.id}: preImplementation não concluído`);
    if (post?.status !== 'completed') errors.push(`${step.id}: postImplementation não concluído`);
  }
  if (step.status === 'in_progress' && pre?.status !== 'completed') {
    errors.push(`${step.id}: implementação iniciada sem gate pré concluído`);
  }
}

if (errors.length) {
  console.error('Falha: project-plan.json viola os gates obrigatórios:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Gates do project-plan.json válidos.');
