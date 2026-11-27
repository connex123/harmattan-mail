// Assembles the whole Sahel island and exposes the queries flight and missions need.
import { createTerrain, heightAt } from './terrain.js';
import { createStrips, createTracks, surfaceAt, STRIP_RAISE, isBlocked } from './runways.js';
import { createAirfieldProps } from './airfieldProps.js';
import { createTrees } from './treesAndBaobabs.js';
import { createLandmarks } from './villagesAndTown.js';
import { createTowns } from './towns.js';

export function createWorld(scene, seed = 1) {
  createTerrain(scene);
  createStrips(scene, heightAt);
  createTracks(scene, heightAt);
  const props = createAirfieldProps(scene, heightAt);
  const trees = createTrees(scene, heightAt, seed);
  const lm = createLandmarks(scene, heightAt);
  const towns = createTowns(scene, heightAt, seed);
  const obstacles = [...trees.obstacles, ...lm.obstacles, ...towns.obstacles];
  return {
    heightAt, surfaceAt, isBlocked, obstacles, props,
    groundHeight(x, z) { return heightAt(x, z) + (surfaceAt(x, z).type === 'strip' ? STRIP_RAISE : 0); },
  };
}
