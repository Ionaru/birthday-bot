import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Routes } from 'discord.js';

import { parseGuildIds, planCommandSync } from './command-registrar.ts';

const APP = '302011421523443713';

describe('parseGuildIds', () => {
    it('splits a comma-separated list', () => {
        assert.deepEqual(parseGuildIds('1,2,3'), ['1', '2', '3']);
    });

    it('trims stray whitespace and drops blanks', () => {
        assert.deepEqual(parseGuildIds(' 1 , ,2,'), ['1', '2']);
    });

    it('treats unset and empty as no guilds', () => {
        assert.deepEqual(parseGuildIds(undefined), []);
        assert.deepEqual(parseGuildIds(''), []);
        assert.deepEqual(parseGuildIds('   '), []);
    });
});

describe('planCommandSync', () => {
    describe('with no guilds configured', () => {
        it('registers globally', () => {
            const plan = planCommandSync(APP, [], []);
            assert.deepEqual(plan.register.map((s) => s.route), [Routes.applicationCommands(APP)]);
        });

        it('clears every guild the bot is in', () => {
            // This is the regression: the pre-2026 bot always registered guild-scoped,
            // so after the move to global registration every command appeared twice in
            // the picker. Discord never expires those, and a bulk PUT only overwrites
            // the bucket it targets.
            const plan = planCommandSync(APP, [], ['111', '222']);
            assert.deepEqual(plan.clear.map((s) => s.route), [
                Routes.applicationGuildCommands(APP, '111'),
                Routes.applicationGuildCommands(APP, '222'),
            ]);
        });

        it('has nothing to clear when the bot is in no guilds', () => {
            assert.deepEqual(planCommandSync(APP, [], []).clear, []);
        });
    });

    describe('with guilds configured', () => {
        it('registers in each configured guild', () => {
            const plan = planCommandSync(APP, ['111', '222'], ['111', '222']);
            assert.deepEqual(plan.register.map((s) => s.route), [
                Routes.applicationGuildCommands(APP, '111'),
                Routes.applicationGuildCommands(APP, '222'),
            ]);
        });

        it('clears the global scope, so switching back leaves no residue', () => {
            const plan = planCommandSync(APP, ['111'], ['111']);
            assert.deepEqual(plan.clear.map((s) => s.route), [Routes.applicationCommands(APP)]);
        });

        it('registers only where configured, not everywhere the bot happens to be', () => {
            const plan = planCommandSync(APP, ['111'], ['111', '999']);
            assert.deepEqual(plan.register.map((s) => s.route), [
                Routes.applicationGuildCommands(APP, '111'),
            ]);
        });
    });

    it('never registers and clears the same scope', () => {
        for (const [guilds, joined] of [[[], ['111']], [['111'], ['111', '222']], [['1', '2'], ['1', '2']]] as const) {
            const plan = planCommandSync(APP, guilds, joined);
            const registered = new Set(plan.register.map((s) => s.route));
            for (const scope of plan.clear) {
                assert.ok(!registered.has(scope.route), `${scope.route} is both registered and cleared`);
            }
        }
    });
});
