import assert from 'node:assert/strict';
import {
  molarityToMass,
  dilution,
  theoreticalCapacity,
  rcfToRpm,
  rpmToRcf,
  cellSeeding,
  encapsulation,
  beerLambert
} from '../js/tools.js';

const close=(actual,expected,tol=1e-6)=>assert.ok(Math.abs(actual-expected)<=tol,`${actual} ≠ ${expected}`);

{
  const r=molarityToMass({concentration:1,concentrationUnit:'mM',volume:1,volumeUnit:'mL',mw:100,massUnit:'mg'});
  close(r.mass.value,0.1,1e-9);
}

{
  const r=dilution({c1:10,c1Unit:'mM',c2:1,c2Unit:'mM',v2:10,v2Unit:'mL',outUnit:'mL'});
  close(r.stockVolume.value,1,1e-9);
  close(r.diluentVolume.value,9,1e-9);
}

{
  const r=theoreticalCapacity({electrons:1,mw:6.94});
  close(r.capacity.value,3861.7,0.5);
}

{
  const rpm=rcfToRpm({rcf:10000,radius:8}).rpm.value;
  const rcf=rpmToRcf({rpm,radius:8}).rcf.value;
  close(rcf,10000,1);
}

{
  const r=cellSeeding({cellsPerWell:5000,wells:40,suspensionCellsPerMl:1.5e6,volumePerWellUl:100,overage:10,vessel:'96-well'});
  assert.ok(r.medium.value>0,'Cell-seeding medium volume must remain positive.');
  close(r.totalCells.value,220000,1);
}

{
  const r=encapsulation({initial:100,free:20,recovered:200,startingSolids:250});
  close(r.ee.value,80,1e-9);
  close(r.loading.value,40,1e-9);
  close(r.recovery.value,80,1e-9);
}

{
  const r=beerLambert({absorbance:1,epsilon:10000,path:1});
  close(r.concentration.value,1e-4,1e-10);
}

console.log('NOOR tool tests passed.');
