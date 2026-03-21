import { supabase } from '../supabase'

export async function notify(userId, type, actorId, translatorId=null, message=null) {
  if (!userId || userId === actorId) return
  await supabase.from('notifications').insert({
    user_id: userId, type, actor_id: actorId,
    translator_id: translatorId, message, read: false,
  })
}

export async function checkAndAwardBadges(userId) {
  const [{ data: trans }, { data: ratings }, { data: comments }, { data: follows }, { data: profile }] = await Promise.all([
    supabase.from('translators').select('words,grammar').eq('user_id', userId),
    supabase.from('ratings').select('id').eq('user_id', userId),
    supabase.from('comments').select('translator_id').eq('user_id', userId),
    supabase.from('follows').select('id').eq('following_id', userId),
    supabase.from('profiles').select('badges').eq('id', userId).single(),
  ])

  const badges = profile?.badges || []
  const toAward = []
  const totalWords = (trans||[]).reduce((s,t) => s + Object.keys(t.words||{}).length, 0)
  const hasGrammar = (trans||[]).some(t => t.grammar)
  const uniqueCommentedTranslators = new Set((comments||[]).map(c => c.translator_id)).size

  if (totalWords >= 50  && !badges.includes('wordsmith')) toAward.push('wordsmith')
  if (totalWords >= 200 && !badges.includes('lexicon'))   toAward.push('lexicon')
  if ((trans||[]).length >= 5  && !badges.includes('polyglot'))  toAward.push('polyglot')
  if (hasGrammar && !badges.includes('architect'))        toAward.push('architect')
  if ((ratings||[]).length >= 20 && !badges.includes('scholar')) toAward.push('scholar')
  if ((follows||[]).length >= 10 && !badges.includes('social'))  toAward.push('social')
  if (uniqueCommentedTranslators >= 10 && !badges.includes('critic')) toAward.push('critic')

  if (toAward.length > 0) {
    await supabase.from('profiles').update({ badges: [...badges, ...toAward] }).eq('id', userId)
  }
  return toAward
}
