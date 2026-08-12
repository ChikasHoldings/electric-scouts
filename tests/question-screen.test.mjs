import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * Guards the contact-field carryover bug.
 *
 * ZipQuestion, VerifyQuestion and ContactQuestion each seed their input from
 * `state` with `useState`, whose initialiser only runs on mount. One
 * ContactQuestion serves the name, email and phone questions, so with no `key`
 * React saw the same component type in the same position across the
 * transition, kept the mounted instance, and carried the draft with it: the
 * name the visitor had just typed reappeared as the prefilled email and then
 * as the phone number.
 *
 * The `key` QuestionFrame already carried cannot stand in for these. It sits
 * on the div that frame returns, so it restarts the entrance animation but has
 * no bearing on how React reconciles the stateful component rendered above it.
 *
 * This reads the source because the behaviour needs a DOM and a React renderer
 * to observe, and the suite runs on plain node. The rendered behaviour was
 * verified in Chromium against the built app: without the key the email field
 * arrived holding "Henry", with it both email and phone arrive empty.
 */
const SOURCE = readFileSync(new URL('../src/pages/CompareRates.jsx', import.meta.url), 'utf8');

const STATEFUL_QUESTION_COMPONENTS = ['ZipQuestion', 'VerifyQuestion', 'ContactQuestion'];

describe('QuestionScreen keys every question that owns a draft', () => {
  for (const component of STATEFUL_QUESTION_COMPONENTS) {
    test(`${component} is keyed on the question id`, () => {
      const opening = new RegExp(`<${component}\\b[^>]*?>`, 's');
      const match = SOURCE.match(opening);

      assert.ok(match, `${component} is no longer rendered by CompareRates.jsx`);
      assert.match(
        match[0],
        /key=\{question\.id\}/,
        `${component} must carry key={question.id}, or React reuses the mounted ` +
          `instance across questions and the previous answer stays in the field`
      );
    });
  }
});
