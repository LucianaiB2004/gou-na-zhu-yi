import test from 'node:test';import assert from 'node:assert/strict';
import {reviseTrip} from '../public/trip.js';
import {validateTrip} from '../src/decision.mjs';
test('连续重选保留原始顾虑、历次补充与未更改行程',()=>{
 const first={destination:'杭州',checkIn:'2026-11-14',checkOut:'2026-11-16',rooms:1,budget:1000,minRating:4,concern:'靠近西湖，不住机场附近',excluded:[],revisions:[]};
 const second=reviseTrip(first,'更便宜','a');const third=reviseTrip(second,'地铁方便','b');
 assert.equal(third.concern,first.concern);assert.deepEqual(third.revisions,['更便宜','地铁方便']);assert.deepEqual(third.excluded,['a','b']);assert.equal(third.checkIn,first.checkIn);assert.equal(third.budget,1000);
 assert.deepEqual(validateTrip(third,'2026-11-02').revisions,third.revisions);
});
