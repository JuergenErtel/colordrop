import { executeDogAttack } from '../js/dog.js';

let pass = 0, total = 0;
const check = (name, cond) => { total++; if (cond) { pass++; console.log('PASS ', name); } else { console.log('FAIL ', name); } };

// 1) Quelle gelöst (4 gleiche) → kein Klau, Röhren unverändert
{
  const tubes = [['r','r','r','r'], ['b']];
  const moved = executeDogAttack(tubes, 0, 1);
  check('solved source → no steal', moved === null);
  check('solved source → tubes unchanged', tubes[0].length === 4 && tubes[1].length === 1);
}

// 2) Quelle NICHT gelöst (gemischt) → klaut oberstes
{
  const tubes = [['r','b','g','y'], ['b']];   // 4 gemischt = nicht gelöst
  const moved = executeDogAttack(tubes, 0, 1);
  check('mixed source → steals top', moved === 'y');
  check('mixed source → moved ball', tubes[0].length === 3 && tubes[1].length === 2 && tubes[1][1] === 'y');
}

// 3) Quelle teilgefüllt (3 gleiche, nicht voll) → klaut (nicht gelöst)
{
  const tubes = [['r','r','r'], []];
  const moved = executeDogAttack(tubes, 0, 1);
  check('partial source → steals', moved === 'r' && tubes[0].length === 2 && tubes[1].length === 1);
}

// 4) Ziel voll → kein Klau
{
  const tubes = [['r','b'], ['g','g','g','g']];
  const moved = executeDogAttack(tubes, 0, 1);
  check('full dest → no steal', moved === null && tubes[0].length === 2);
}

console.log(`${pass}/${total}`);
process.exit(pass === total ? 0 : 1);
