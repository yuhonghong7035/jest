/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */
'use strict';

import fs from 'fs';
import os from 'os';
import path from 'path';
import runJest, {json as runWithJson} from '../runJest';
import {cleanup} from '../Utils';

const DIR = path.join(os.tmpdir(), 'jest-global-setup');
const project1DIR = path.join(os.tmpdir(), 'jest-global-setup-project-1');
const project2DIR = path.join(os.tmpdir(), 'jest-global-setup-project-2');

beforeEach(() => {
  cleanup(DIR);
  cleanup(project1DIR);
  cleanup(project2DIR);
});
afterAll(() => {
  cleanup(DIR);
  cleanup(project1DIR);
  cleanup(project2DIR);
});

test('globalSetup is triggered once before all test suites', () => {
  const setupPath = path.resolve(__dirname, '../global-setup/setup.js');
  const result = runWithJson('global-setup', [
    `--globalSetup=${setupPath}`,
    `--testPathPattern=__tests__`,
  ]);

  expect(result.status).toBe(0);
  const files = fs.readdirSync(DIR);
  expect(files).toHaveLength(1);
  const setup = fs.readFileSync(path.join(DIR, files[0]), 'utf8');
  expect(setup).toBe('setup');
});

test('jest throws an error when globalSetup does not export a function', () => {
  const setupPath = path.resolve(__dirname, '../global-setup/invalid_setup.js');
  const {status, stderr} = runJest('global-setup', [
    `--globalSetup=${setupPath}`,
    `--testPathPattern=__tests__`,
  ]);

  expect(status).toBe(1);
  expect(stderr).toMatch(
    `TypeError: globalSetup file must export a function at ${setupPath}`,
  );
});

test('globalSetup function gets jest config object as a parameter', () => {
  const setupPath = path.resolve(
    __dirname,
    '../global-setup/setup-with-config.js',
  );

  const testPathPattern = 'pass';

  const result = runJest('global-setup', [
    `--globalSetup=${setupPath}`,
    `--testPathPattern=${testPathPattern}`,
  ]);

  expect(result.stdout).toBe(testPathPattern);
});

test('should call globalSetup function of multiple projects', () => {
  const configPath = path.resolve(
    __dirname,
    '../global-setup/projects.jest.config.js',
  );

  const result = runWithJson('global-setup', [`--config=${configPath}`]);

  expect(result.status).toBe(0);

  expect(fs.existsSync(DIR)).toBe(true);
  expect(fs.existsSync(project1DIR)).toBe(true);
  expect(fs.existsSync(project2DIR)).toBe(true);
});

test('should not call a globalSetup of a project if there are no tests to run from this project', () => {
  const configPath = path.resolve(
    __dirname,
    '../global-setup/projects.jest.config.js',
  );

  const result = runWithJson('global-setup', [
    `--config=${configPath}`,
    '--testPathPattern=project-1',
  ]);

  expect(result.status).toBe(0);

  expect(fs.existsSync(DIR)).toBe(true);
  expect(fs.existsSync(project1DIR)).toBe(true);
  expect(fs.existsSync(project2DIR)).toBe(false);
});
