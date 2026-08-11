/**
 * The resolver that drives the dynamic flow.
 *
 * There is no hardcoded step sequence: on every state change the engine asks
 * "what is the first question that applies and isn't answered yet?". A bill
 * that fills in usage, provider and spend therefore removes those questions
 * from the flow without any branch-specific wiring.
 */

import { QUESTIONS, QUESTIONS_BY_ID } from './questionRegistry.js';

/**
 * The next question to ask, or null when the questionnaire is complete.
 */
export function determineNextQuestion(state) {
  for (const question of QUESTIONS) {
    if (!question.appliesWhen(state)) continue;
    if (question.satisfiedBy(state)) continue;
    return question;
  }
  return null;
}

/** Every question the current state still has to answer, in order. */
export function remainingQuestions(state) {
  return QUESTIONS.filter((q) => q.appliesWhen(state) && !q.satisfiedBy(state));
}

/** Questions already answered, used to walk backwards. */
export function answeredQuestions(state) {
  return QUESTIONS.filter((q) => q.appliesWhen(state) && q.satisfiedBy(state));
}

/**
 * The question to return to when the visitor presses Back.
 *
 * Resolved from `state.history` — the questions actually shown — rather than
 * from the registry. A question the bill answered was never displayed, so
 * stepping backwards must skip straight past it to the last real screen.
 *
 * Entries that no longer apply (because a branch switch invalidated them) are
 * discarded on the way back, so Back can never land on a dead branch.
 */
export function previousQuestion(state, currentQuestionId) {
  const history = Array.isArray(state.history) ? state.history : [];

  // Walk back from the current question, or from the end when the visitor is
  // past the questionnaire and returning from the results screen.
  const from = currentQuestionId
    ? history.lastIndexOf(currentQuestionId)
    : history.length;
  const start = from === -1 ? history.length - 1 : from - 1;

  for (let i = start; i >= 0; i -= 1) {
    const question = QUESTIONS_BY_ID[history[i]];
    if (question && question.appliesWhen(state)) return question;
  }
  return null;
}

/** Record that a question was shown, without duplicating consecutive entries. */
export function pushHistory(history, questionId) {
  const list = Array.isArray(history) ? history : [];
  if (list[list.length - 1] === questionId) return list;
  return [...list, questionId];
}

/**
 * Take one step back: the question to return to, and the history to keep.
 *
 * History is truncated to everything *before* the target, which is what keeps
 * it a stack of the current path rather than an ever-growing log. Without the
 * truncation, navigating back and forth leaves later questions sitting after an
 * earlier one in the list, and a subsequent Back resolves to a question further
 * forward than where the visitor already is — so Back silently does nothing.
 *
 * The caller re-pushes the target when it renders.
 */
export function stepBack(state, currentQuestionId) {
  const history = Array.isArray(state.history) ? state.history : [];

  const from = currentQuestionId
    ? history.lastIndexOf(currentQuestionId)
    : history.length;
  const start = from === -1 ? history.length - 1 : from - 1;

  for (let i = start; i >= 0; i -= 1) {
    const question = QUESTIONS_BY_ID[history[i]];
    if (question && question.appliesWhen(state)) {
      return { question, history: history.slice(0, i) };
    }
  }
  return null;
}

/**
 * Rough progress through the questionnaire, 0–1.
 *
 * Derived from answered-vs-remaining rather than a fixed step count, because
 * the number of questions varies with the branch and with what the bill
 * supplied. Used only to fill the subtle stage indicator.
 */
export function progressRatio(state) {
  const applicable = QUESTIONS.filter((q) => q.appliesWhen(state));
  if (applicable.length === 0) return 0;
  const answered = applicable.filter((q) => q.satisfiedBy(state)).length;
  return answered / applicable.length;
}
