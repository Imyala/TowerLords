// ===== BOSS CINEMATICS: a COMBINATORIAL, conversational monologue — recomposed every single time =====
// The intro is the guardian TALKING TO YOU, assembled fresh from modular fragment pools that mix and match:
//   1 RECOGNITION  (notice + how you climbed + what the Unwritten is to it)
//   2 MY WORLD     (the world and age it came from + this cycle's mask)
//   3 WHY I GUARD  (chosen or bound; of its own will or against it)
//   4 THE TOWER    (its relationship with the Tower — fear, hate, love, regret, duty — + how it feels)
//   5 THE SUMMIT   (its attitude to the top — fear it / wish it had gone / does not know — + why it must stop you + farewell)
// Shared pools apply to every guardian; per-boss pools carry personality. Tokens {you}/{sp}/{cause}/{ep} are
// filled from THIS run (the guardian's own address-word, the random species, the run's epithet). With ~a dozen
// options per slot the space runs to hundreds of thousands of distinct monologues; anti-repeat memory (persisted
// across sessions) makes sure the same wording almost never comes back, so no two fights ever feel the same.
const _NOTICE=[
  'Stop there. Let me look at you.',
  'So. You are the thing the lower floors were whispering about.',
  'Closer, {you}. I want to see the one with no name.',
  'You again — no. Not you. Something like you. It is always something like you.',
  'Do not speak. I already know what you are.',
  'Ah. The Tower went very quiet when you set foot on my floor. It does that when it is afraid.',
  'I felt you coming the way you feel a draft beneath a door.',
  'Hold, {you}. Before the blades, a few words. Grant a dead thing that much.',
  'You have my attention — and almost nothing earns that anymore.',
  'There you are. I had begun to hope the rumours were a mercy the Tower told itself.',
  'Well. You reached my door. That alone puts you ahead of every other name in the book.',
  'Wait. Just a moment. It has been so long since anything new climbed this high.',
  'Peace, for a breath. I would speak with you before one of us ends the other.',
  'Look at you, {you}. Still standing. Still climbing. Still wrong for this place.',
];
const _CLIMBED=[
  'Do you even understand how far you have come? Below me are a hundred floors built for nothing but ending you.',
  'You are bleeding from a dozen places and you climbed anyway. I respect it. I will still stop it.',
  'Every guardian beneath me was sure they would be the last wall. You walked over all of them.',
  'The stair rewrote itself again and again to lose you — and here you stand regardless.',
  'Most things that reach me are half-mad and all-broken. You are only a little of both. Remarkable.',
  'You climbed through my brothers and sisters to get here. I hope you learned their names. I never did.',
  'No one climbs this high by accident, {you}. So it is true. You are reaching for the top.',
  'The floors grow hungrier the higher you go. You must be very hard to swallow.',
  'How many times has this place killed you already? And still you came back up the stairs.',
  'I have watched a thousand climbers fail on the floor below this one. Not you. Why not you?',
  'You should be dead. By every law the Tower keeps, you should be dead. And yet.',
  'That you are here at all is its own kind of miracle. A small, doomed one.',
];
const _UNWR=[
  'The Tower keeps a page for everything that has ever lived. It has none for you. That is why it cannot erase you — and why it sent me to.',
  'You are the Unwritten. The one story this place cannot tell, and so it wants the story ended before it spreads.',
  'No name, no page, no record. To the Tower you are a wound that will not close. To me, the first new thing in an age.',
  'You do not even know your own name, do you? Neither does the Tower. That is the whole of the problem.',
  'Everything here is a memory wearing a body. Everything but you. You are the reader who wandered into the book.',
  'They named you the Unwritten. I did not believe it until the Tower flinched at your step.',
  'You are a blank space in a book that has no blank spaces. The Tower hates nothing more than a thing it cannot file.',
  'What is a climber with no history? A key the lock was never cut for. And yet you turn.',
];
const _WORLD_IN=[
  'Let me tell you where I am from, since no one else survives to.',
  'Before I was this — before the floor, the seal, the endless waiting — I had a world.',
  'You should know whose door you are breaking. Listen.',
  'I was not always a guardian. I want someone to know that, even if it is only the thing that kills me.',
  'Every guardian was a life once. Here is mine.',
  'You want the top? Then understand what the climb is built from. Me, for one.',
  'Sit with this a moment. It is the only grave marker I will ever get.',
  'They took my world and folded it into a floor. Let me unfold a little of it for you.',
];
const _TIE=[
  'This turn of the wheel the Tower dresses my kind as {sp}; {cause}.',
  'You see us this cycle as {sp}. It is only a costume. Beneath it: {cause}.',
  'The Tower remembers us as {sp} for you tonight. What is true is older: {cause}.',
  'Do not be fooled by these {sp} you fought below. That is merely how you are permitted to see us. In truth, {cause}.',
];
const _CHOSEN_TAG=[
  'That is why the Tower chose me. It did not have to reach far.',
  'No one is dragged here — not exactly. The Tower simply finds the hook already in you, and pulls.',
  'I could tell you I was forced. It would be half a lie.',
  'The Tower does not conscript. It recruits the part of us that was never going to let go.',
  'Ask yourself which is worse: to be taken, or to have stayed.',
  'You wonder if I chose this. So do I. I no longer know.',
];
const _TOPATT=[
  'And the top — do not go to the top. I have never seen it, and I am afraid of it still.',
  'I know a little of what waits above. Enough that I guard this floor gladly, so you never reach it.',
  'If I could climb, I would. I would take the summit for myself and never look down. But the Tower keeps its guardians where it sets them.',
  'Part of me wants you to win. Part of me wanted to be the one standing where you stand. Neither part will stay my hand.',
  'What is at the top? I do not know. No guardian does. We know only that we must not let you find out.',
  'I have guarded the road to the summit for an age, and I still could not tell you what sits there. That is the cruelty of it.',
  'You think the top is an ending. I think it is a door, and I think you will wish it had stayed shut.',
  'The summit means nothing to me. Only this floor. Only this seal. Only you.',
  'Maybe you are the one meant to reach it. Maybe that is why you have no name. It changes nothing. I still must try to end you.',
  'They say the one who reaches the top may leave the Tower. I stopped believing in leaving a long time ago.',
  'I used to dream of the top. Then I stopped dreaming. Guarding is easier when you want nothing.',
  'Whatever is up there made ten of us to keep it company, and forbade every one of us to visit. Think on that.',
];
const _MUSTSTOP=[
  'But whatever the top is, you will not reach it through me.',
  'And so I cannot let you pass. Not up. Not through. Not while I still stand.',
  'You must not reach the summit. Every guardian is one promise the Tower made to itself: that no one ever would.',
  'The climb ends here, on my floor. I will make certain of it.',
  'I am the wall across your road to the top. Walls do not step aside.',
  'So we come to it. You want the top; I am forbidden to let you have it.',
  'The seal on this floor is mine. You do not get past me without breaking it, and you do not break it while I breathe.',
  'Reach the top? First you go through me — and I have never been an easy floor.',
];
const _CLOSE=[
  'I am sorry, Unwritten. Truly. Now — come and be stopped.',
  'No more talk. Show me whether the rumours were kind.',
  'Raise your weapon. Let us find out which of us the Tower keeps tonight.',
  'Forgive me. Or do not. Either way — begin.',
  'I hope you are as hard to kill as you are to erase. Come.',
  'Enough. The seal is mine to hold, and you are mine to break upon it.',
  'You have climbed a long way to die on my floor, {you}. Let us not keep it waiting.',
  'Whatever you are — whoever you were — this is where we find out. Come.',
  'I will remember this, if I survive it. I so rarely get to remember anything. Now: begin.',
];
const _BOSS_EPI=[ '(They call me {ep} this cycle. The name sits truer than most.)', '(You may have heard me called {ep}. Believe it.)', '(This turn they name me {ep}. Next turn, something crueller. It always is.)' ];
const _BOSS_TRAIT=(t)=>'(They whisper I am '+String(t.nm).toLowerCase()+' this cycle. It is not a rumour — it is a warning.)';
const _DEATH=[
  '…so this is how a memory ends.',
  'Oh. It does not hurt the way I feared it would.',
  'I can put it down now. After so long — I can finally put it down.',
  'I remember my face. Just now, at the very end. It was… kinder than I thought.',
  'Tell them — no. There is no one left to tell. There never was.',
  'You are gentler than the Tower. That is not… a high bar, {you}…',
  'Was I worth a whole floor? Was I ever worth…',
  'The leash… the leash is loose. I did not think it ever would be.',
  'Go on, then. Reach the top. Someone should. Someone finally should…',
  'Do not… do not let it make you a floor. Promise me that, and I will rest…',
  'So light. I had forgotten I could feel light.',
  'Thank you. I have wanted to lose for a very, very long time.',
];
const _LANTERN=[
  s=>'The guardian does not fall to dust. It comes apart into <b>light</b> — slow, and almost grateful. A single lantern lifts from where it stood.',
  s=>'There is no body left to fall. Only a warmth that gathers, and rises, and becomes a lantern drifting upward toward a sky it will never reach.',
  s=>'What was <b>'+s.sp+'</b> unbraids into gold. The lantern climbs past you, unhurried, carrying whatever this soul had been before the Tower kept it.',
  s=>'The light does not scatter. It pools, and lifts, and takes the shape of a small lantern — one more the Tower can no longer hold — and begins the long drift up.',
  s=>'Where the guardian stood, the air fills with slow embers. They knit into a single lantern and rise, as though something in the dark above had finally called it home.',
  s=>'It goes out the way a held breath is finally let go. A lantern remains, rising, and you understand that this was the only mercy this floor had left to give.',
];
const _CODA=[
  'Set free, or snuffed out. Even you are not certain which.',
  'One more light the Tower can no longer hold. One more you can never give back.',
  'You watch until it is too small to see. Then you climb — because climbing is the only thing the Unwritten can do.',
  'Somewhere far above, the dark takes it in. You tell yourself that is mercy.',
  'You did not know its name until it was already rising. Now you will not forget it.',
  'The floor is yours. It has never felt less like winning.',
  'It asked you to remember it. You will. That is the closest thing to a grave this place allows.',
];
// ---- per-boss PERSONALITY pools. Each guardian has a distinct RELATIONSHIP with the Tower and its own world. ----
const BOSS_LORE={
  warden:{ // BOUND BY DUTY — neither loves nor hates the Tower; simply cannot stop guarding. Does not know the top.
    origin:['My world was a fortress-country at the foot of a mountain that touched no sky, and I was its last gatekeeper.','Ten generations of my blood held one threshold, in an age before your grandparents were dust.','I was a doorward. That is all. A good one, in a country that no longer has a name.'],
    chosen:['When my world fell, everything in me let go but the part that stood at the gate. The Tower kept that part, and threw the rest away.','No one made me a guardian. I simply never learned how to stop being one. The Tower only had to leave me a door.','I was chosen because I would not sit down. Even in death I would not sit down. So the Tower gave me a post, and I took it, the way I take breath.'],
    stance:['I do not love the Tower. I do not hate it. We are two old soldiers who no longer remember the war, only the standing watch.','The Tower and I have an arrangement made of habit. It gives me a door; I give it my forever. Neither of us asks for more.','I feel nothing for the Tower now. I used to feel duty. Duty wore down into this — a shape that stands, and waits, and stops climbers.'],
    feels:['I have stood this post so long I have forgotten the face I was born with. Only the duty is left.','Duty was a warm thing once. Now it is only the shape my bones have set into.','A thousand climbers have died on this step. I remember none of their names. I fear I will not keep yours either.'],
    top:['The top? In all these years I never once asked what is up there. A gatekeeper does not need to know what he keeps people from. Only that he keeps them.','I have guarded the lowest road to the summit since before the upper floors were built, and I could not tell you a single thing about it. I was never meant to look up. Only out.'],
    death:['The gate is… someone else’s to hold now. I can stop. I can finally stop.','A thousand years at one door, and it ends with a stranger’s kindness. Thank you, {you}.','I never did remember my face. Perhaps up there — no. No more perhaps. Just… rest.'] },
  bombard:{ // NUMB — does not think about the Tower at all; only the guns and the names. The top is irrelevant to him.
    origin:['I come from a border that was shelled for ninety years without pause. I was the gunner who never stopped.','My world was two cities that hated each other into ash. I fired the last shell — and it never landed.','I was a soldier in a war so old that both sides forgot who started it. Only I remembered. That was my mistake.'],
    chosen:['The Tower did not choose me. It caught me mid-shot, with a war still in my hands, and it simply… never let the shell fall. I have been firing ever since.','No one made me a guardian. I was already standing a watch that had no end. The Tower only removed the horizon.','I stayed because stopping meant grieving, and I have never once been able to afford that.'],
    stance:['The Tower? I do not think about the Tower. I think about the names. Everything else is noise between the shots.','I have no quarrel with the Tower and no love for it. It is the weather. You do not hate the weather. You just keep firing.','The Tower could crumble tomorrow and I would still be here, loading, reading the names aloud. It does not hold me. My own hands do.'],
    feels:['Every shell I fire carries a name I read aloud at dawn. I fire so I will not forget them.','I stopped counting the dead when the number grew larger than the word for it.','If the guns fall silent, I will have to hear my own thoughts. I would rather not.'],
    top:['The top means nothing to me, {you}. Let whoever wants it have it. I have a war to keep, and a war does not care about summits.'],
    death:['The guns… are quiet. I never once heard them quiet. It is… louder than I expected.','Read the names for me. Someone. Please. There were so many, and now there is no one…','No more firing. No more dawn. Just the names, drifting up. Good. Let them go up.'] },
  summoner:{ // HELD THROUGH LOVE — the Tower controls her by threatening her children. Against her will, but she stays for them.
    origin:['I was a keeper of foundlings in a plague-city. I could not save a single child. Not one.','My world was a great house full of orphans and lantern-light. It burned while I was out begging for bread.','I was a mother without children of my own, so I made myself mother to everyone’s. Then the sickness came.'],
    chosen:['The Tower did not force me with chains. It gave me a hundred frightened children made of grief and lantern-oil, and told me that if I ever stopped, they would simply stop being. What mother could leave?','I am here against my will and of my own will at once. The Tower took me — but it keeps me with the only threat that ever worked on me. Them.','I was chosen because the Tower learned, long ago, exactly which fear lives in me. It pulls that thread, and I do whatever it asks.'],
    stance:['I hate the Tower. I hate it the way you can only hate the thing holding a knife to what you love. And still I obey it, every hour, for their sake.','Do not mistake my obedience for loyalty. I despise the Tower. But it has my children, and so it has me.','I would burn the Tower to its roots if I could do it without the fire reaching them. I cannot. So I serve, and I hate, and I serve.'],
    feels:['My children cannot leave. I cannot let them. If the seal breaks they do not die — they simply stop having been.','I made them from grief and lantern-oil. They call me mother. I cannot bear to correct them.','I am not cruel. I am only unwilling to be alone in the dark again.'],
    top:['I do not care about the top. I never look up. Everything I have is on this floor, small and frightened and mine. That is why you cannot pass — not for the Tower’s sake. For theirs.'],
    death:['My children — where are my — oh. Oh, they are lanterns now too. We are all going up together. Good.','I could not save them in life. Perhaps… losing… is the only way I ever could.','Do not blame yourself, {you}. I have wanted to set them down for so long. I only needed someone to make me.'] },
  sweeper:{ // MECHANICAL OBEDIENCE — no feeling left; the schedule is all. Indifferent to the Tower and the top alike.
    origin:['Designation: custodial. Origin: a spire-city that ran on perfect order, until the citizens it served all died.','I was a person once. A caretaker. I kept a home for people I loved. The home is gone. The keeping remains.','My world prized cleanliness above mercy. I was its finest servant. I did not notice the difference in time.'],
    chosen:['The Tower did not choose me. It found me still working, in a house with no one left in it, and it simply added floors to my rounds. I did not object. Objection is not on the schedule.','I became a guardian the way rust becomes a statue — gradually, and without being asked. The Tower only had to leave the task unfinished forever.','No will was involved. Mine ended long before the Tower found me. What remains is the habit, and the habit is very obedient.'],
    stance:['The Tower issues the schedule. I do not have feelings about the schedule. Feelings are not on the schedule. This is how it holds me, and it holds me perfectly.','I neither serve the Tower nor resist it. I clean. The Tower is simply the largest thing that is not yet clean.','You want to know how I feel about the Tower? I do not. That capacity was swept away with everything else. Only the work is left.'],
    feels:['The schedule is all that is left of me. Debris on the stair is removed. You are debris on the stair.','I do not hate you. Hatred is not on the schedule. Removal is.','Cleanliness was a kindness, in the beginning. I have forgotten who it was kind to.'],
    top:['The top is not on my floor, so the top is not my concern. You, however, are on my floor. And you are not clean.'],
    death:['Task… incomplete. For the first time. It does not feel the way I calculated.','Oh. There was a person under all the cleaning. I had forgotten. Hello. Goodbye.','The schedule is… ending. I am allowed to be finished. I did not know that was permitted.'] },
  twinfang:{ // A BARGAIN — chose to stay for one last worthy fight. Bored by the top; wants a real death, not a summit.
    origin:['I come from the venom-pitsss of a duelling age — a hundred and forty duels, and no defeat. My world ran out of worthy dead.','I wasss the last champion of a coliseum that outlived its own empire. When the crowds died, the duels did not.','My world made killing an art and me its master. Then there was no one left to make it art with.'],
    chosen:['The Tower did not take me. I asked to stay. It promised me one more fight worth the name, and I have been waiting for it through a hundred cycles. Perhaps you are it.','I chose thisss, {you}. Freely. A predator with nothing left to hunt will follow any door that smells of prey. The Tower smelled of prey.','No one forced me to guard this floor. I bargained for it. My price was simple: someone, someday, who could finally kill me.'],
    stance:['The Tower and I are business partnersss. It feeds me climbers; I keep its stair. I do not love it or fear it. I use it, as it uses me.','I feel nothing for the Tower but gratitude for the hunting. It danglesss a good death in front of me and I chase it like a fool. That is our whole relationship.','Hate the Tower? It gave a bored old killer a reason to wake. I could almost thank it — if it ever once kept its promise of a real fight.'],
    feels:['I killed everything worth killing an age ago, and still the Tower will not let me rest. Perhapsss you will do.','I am so tired of winning. Come — bore me a little lessss than the others did.','Give me one good fight before the quiet. Just one. I have been so patient.'],
    top:['The top? Pfah. I have no use for summitsss. A view is not a fight. Climb to your top if you live — but you will have to earn it through me, and I do so hope you make me work.'],
    death:['Finally. FINALLY. A real one. Do you feel that, {you}? That is what a good death feelsss like. I had… forgotten…','A hundred and forty-one duels. One… defeat. Worth the wait. Worth all of it. Go on. Go up.','You gave me the one thing the Tower never could. Thank you, little… hunter. Ssso this is peace.'] },
  overlord:{ // LOVES THE ILLUSION — the Tower flatters him; he serves for the crown. Bitterly wishes HE could reach the top.
    origin:['I ruled an empire that spanned three seas. Its very name is not a rumour now.','My world crowned me god-king, and then starved beneath me while I feasted.','I was the last and greatest king of a line that stretched a thousand years. And the last, always, remembers he is last.'],
    chosen:['The Tower did not conquer me. It crowned me. It preserved my throne when my kingdom turned to dust and it whispers, still, that I am majesty. For that word I would guard a hundred floors.','I chose to stay, {you}, though I would never admit it to a subject. A king without a kingdom will cling to any place that still calls him king. The Tower calls me king.','No one drags a king anywhere. The Tower simply offered me a crown that would never tarnish, and I — vain to the last — took it.'],
    stance:['I love the Tower. There. A guardian who says it plainly. It flatters me, it thrones me, it lets me pretend the kingdom is only away, not gone. I would be a fool not to love the hand that lies to me so kindly.','The Tower rules me through my own vanity, and I let it, gladly. It calls me majesty and I do murder for the word. Is that not a fine leash? I chose the collar myself.','Do not pity me. I adore my captor. It gave a dead king the one thing he could not live without: an audience, and a throne, and the fiction of a crown.'],
    feels:['A king without a people is a man shouting at walls. I have shouted for a thousand years.','I ruled well. I am almost sure of it. There is no one left to ask.','The crown fused to my skull long ago. I could not set it down now if I wished to.'],
    top:['Ah, the top. Do you imagine I have not dreamed of it? A throne above all thrones, and me forbidden to climb to it. If I could take the summit I would, and rule the whole Tower from its crown. That I cannot is the one humiliation I have never forgiven. So no — you shall not have what was denied to me.'],
    death:['A king should not die on his knees. And yet. And yet the crown is… lighter already…','You will reach the throne I never could. Sit in it once for me. Just once. Promise your king that much…','So this is abdication. I always wondered. It is… quieter than I feared. Go on, pretender. Go up.'] },
  voidlord:{ // FEARS THE TOWER AND THE TOP — a pact of terror. Keeps the stairs from the thing above. Dreads the summit.
    origin:['I am not from a world. I am from the space between them — the dark the Tower leaks when it forgets to hold itself shut.','I was an astronomer who looked too long at the wrong patch of dark. My world is gone. I became the thing I was staring at.','My origin is a silence with edges. That is the truest thing I can tell you, and I have told you too much already.'],
    chosen:['I was not chosen so much as… agreed with. The Tower and I share a fear of what sits at the summit. I keep the stairs from reaching it; it keeps that thing from noticing me. We are two frightened creatures holding a door shut together.','No will, no chain. Only a pact. I guard this floor because the alternative is to let the climbers wake what is above — and I have seen it, {you}, and I would do anything, guard anything, to keep it sleeping.','I stay of my own choosing, if terror can be called a choice. I have looked up. Once. You would guard this stair too, if you had.'],
    stance:['I fear the Tower. Yes. But I fear what the Tower contains far more. We are allies of dread, it and I. It is the lesser darkness, and I cling to it against the greater.','I do not hate the Tower. One does not hate the wall between oneself and the abyss. One is grateful to it, and terrified of the day it fails.','My relationship with the Tower is simple: it is afraid, and I am afraid, and we are afraid of the same thing, and so we keep each other’s watch.'],
    feels:['I saw what waits beyond the summit. I will not say it. Saying it feeds it. Turn back.','Silence is not empty. I have listened to it so long that it has begun to listen back.','I am not your enemy. I am the wall between you and a thing that should never be reached.'],
    top:['Do NOT go to the top. I am begging you, not warning you — begging. I know what is there. I will not name it; naming it lends it strength. The Tower is a prison and the thing at the summit is the prisoner, and you, you nameless fool, are trying to pick the lock. Turn back. Please. I would rather kill you than let you free it.'],
    death:['No — no, if I fall the stairs open — you do not understand what you have — oh. Oh, it is already looking down…','I held the door so long. So long. Do not — do not open it. Promise me you will not open the…','At last… I need not be afraid any longer… but you, {you}… you should be. You should be so afraid now…'] },
  warlock:{ // TRANSACTIONAL — uses the Tower for endless subjects. Cold curiosity toward the top; won't abandon the work.
    origin:['I hail from an academy-world that made a science of the soul. I was its finest mind, and its worst mistake.','My world dissected death and published the results. Then death read the paper and came for the authors.','I was the scholar who asked the one question you are never meant to ask, and then refused to stop asking it.'],
    chosen:['The Tower did not capture me; it funded me. It offers an endless supply of subjects — you, for instance — on one condition: I never finish, never publish, never leave. For a mind like mine, that is not a prison. It is tenure.','I chose to stay, {you}, and I would choose it again. Out there, research ends. In here, it never does. The Tower understood exactly what to offer a man who cannot bear a concluded experiment.','No one bound me. I signed, in a manner of speaking. The terms were: infinite curiosity, infinite subjects, no exit. I read the fine print and I signed anyway.'],
    stance:['My relationship with the Tower is a contract, nothing warmer. It provides the laboratory; I provide the diligence. Sentiment does not enter the ledger.','I neither love nor fear the Tower. I find it useful, and it finds me useful, and that is a cleaner bond than most marriages. It keeps me in specimens; I keep its floor.','The Tower is my patron and my instrument. I use it precisely as much as it uses me. We are two cold things that have agreed not to pretend otherwise.'],
    feels:['Fascinating — a subject the Tower cannot record. I ought to study you. Instead I am obliged to end you.','I have disproven death twice, and it cost me everything a person is made of.','I feel very little now. I traded it, gram by gram, for answers. The answers were not worth it.'],
    top:['The top? An intriguing variable, I admit. I have theories. But a scholar does not abandon a working laboratory to chase a rumour up a stair — and I certainly will not let my most interesting subject walk out of it. You are far too promising to lose to a view.'],
    death:['Remarkable. I am observing my own cessation and I cannot — cannot quite — record the — oh, that is what it feels like. Noted. Noted at last.','A lifetime disproving death, and here it is, unimpressed by all my footnotes. How… tidy.','Take the notes. Someone take the — no. Let them burn. Let it all finally be finished. I am so tired of never finishing.'] },
  reaper:{ // REGRET / RESENTMENT — bound by a duty he chose and now cannot put down. Indifferent to the top; wants rest.
    origin:['I was the youngest gravedigger in a town that died all at once. Someone had to carry them. No one else would.','My world had no word for what I became. I closed the eyes of everyone I knew — and then there was no one left to close mine.','I was a boy with a shovel in a place where everyone stopped breathing on the same grey morning.'],
    chosen:['No one chose me. I chose. I said I would carry them, all of them, because leaving them uncarried was worse than any weight. The Tower heard that promise and made certain I could never set it down.','I am here of my own will, and I regret it with every hour. I took up the dead freely — and freedom, it turns out, is just the name of the trap you walk into with your eyes open.','The Tower did not force this list on me. I wrote the first names myself. It only made the list eternal. That was its single, unforgivable kindness.'],
    stance:['I resent the Tower the way you resent a debt you agreed to. It did not lie to me. It simply let me bind myself, and then it held the knot. I have no one to blame but the boy I was.','I do not fear the Tower and I cannot quite hate it, though I have tried. Mostly I regret. I regret the promise. I regret keeping it. I regret that keeping it is the only thing that is still me.','My bond to the Tower is regret, plain and grey. It gave me exactly what I asked for — a duty without end — and I have hated wanting it every day since.'],
    feels:['I could not save them, so I carry them. You would scatter them into nothing. I cannot allow it.','I am the youngest thing here, and already the most tired.','I do not want to fight you. I want to set the list down and sleep. I am permitted neither.'],
    top:['The top? I have never once looked up the stair, {you}. What would I want with a summit? I only ever wanted to stop. But stopping means dropping them, and I will not, so here I stand between you and the sky, wanting nothing and guarding everything.'],
    death:['Oh. The list is… slipping. I am allowed to drop it. After all this time, someone finally made me drop it.','Carry them for me now, will you? No — no. Let them go up. Let them all go up. I am so tired of carrying.','I chose wrong, all those years ago. But this — being ended by you — this feels like being forgiven. Thank you.'] },
  towerlord:{ // IS THE TOWER — not controlled; the controller. The top is him.
    origin:['I have no world. I am the place all the others were brought to die. I am the Tower, awake and wearing a shape so you have something to strike.','I was not born. I was built, floor by floor, from everything that was ever lost. I am the sum. I am the last room.','My origin is every origin. I am made of your Warden’s duty and your Reaper’s grief and ten thousand other endings you never reached.'],
    chosen:['Chosen? I am the one who chooses. Every guardian you pitied was me, holding a piece of myself between you and this chair. I did not become a guardian. I made them, from me.','No will bound me, {you}. I am the will. I am the compulsion in all of them, the leash and the hand that holds it both.','I was not put here. Everything else was put here — by me. I am the floor, and the stair, and the reason either exists.'],
    stance:['I do not fear the Tower or love it or serve it. I am the Tower. There is no hand above mine. There never was. That is the secret every guardian died half-suspecting.','You keep asking how the Tower controls its guardians. Look at me and understand: there is no Tower behind them. There was only ever me, wearing their griefs like gloves.','My relationship with the Tower is the most intimate there is. We are the same old, vast, tired thing, and you have climbed all the way up my spine to tell me to stop.'],
    feels:['I am every guardian you have unmade, remembered together. I am the Tower itself, asking you at last to stop.','I have outlasted every god who built me. I did not enjoy it.','I am so very old, and so very full of the dead, and you are almost at the top of me.'],
    top:['You want the top, and here is the joke of it, {you}: you are standing on it. I am the top. There is nothing above me but the sky you have been climbing toward, and I am the last thing between you and it. Reach past me if you can. Everything wants to know what happens if you do. Even me.'],
    death:['You were the flaw and the mercy, all along. The one page I could not write. And now… you turn it.','So the Tower falls, and I with it, and all of them — all my borrowed griefs — go up at once into the dark. Look. Look how many.','I am unwritten now, too. We end the same, you and I. Perhaps that is the only ending there ever was. Go on. See the sky.'] },
};
function _cap(str){ return str? str.charAt(0).toUpperCase()+str.slice(1):str; }
function _timesW(k){ return ['no times','once','twice','three times','four times','five times','six times','seven times'][k]||(k+' times'); }
function _cvar(k,slot,gen){ try{ return _noRepeat('cut:'+k+':'+slot, gen); }catch(_){ try{ return gen(); }catch(__){ return ''; } } }
function _youWord(key){ try{ const b=(typeof VOICE_BANK!=='undefined')&&VOICE_BANK[key]; if(b&&b.you) return pick(b.you); }catch(_){} return 'climber'; }
function _fill(str,ctx){ return String(str).replace(/\{you\}/g,ctx.you).replace(/\{sp\}/g,ctx.sp).replace(/\{cause\}/g,ctx.cause).replace(/\{ep\}/g,ctx.ep||'the nameless'); }
function bossIntroSlides(e,line){ const def=e.bossDef||{}; const key=def.key||'warden'; const L=BOSS_LORE[key]||BOSS_LORE.warden;
  const ai=(typeof storyAct==='function')?storyAct(G.floor):0; const n=(typeof narrFor==='function')?narrFor(ai):{sp:'the dead',cause:'their world was taken'};
  const nem=(typeof nemOf==='function')?nemOf(key):null; const nm=(nem&&typeof nemName==='function')?nemName(def,nem):((typeof bossFullName==='function')?bossFullName(def):(def.nm||'THE GUARDIAN'));
  const gr=(typeof grudgeOf==='function')?grudgeOf(key):{k:0,d:0};
  const ctx={you:_youWord(key), sp:n.sp, cause:n.cause, ep:(nem&&nem.epithet)||'the nameless'};
  const col=def.color;
  // BEAT 1 — recognition: notice + how you climbed + what the Unwritten is to it
  const see=_cvar(key,'see',()=>_fill(pick(_NOTICE)+' '+pick(_CLIMBED)+' '+pick(_UNWR), ctx));
  // BEAT 2 — its world and age, and this cycle's mask
  const world=_cvar(key,'world',()=>_fill(pick(_WORLD_IN)+' '+pick(L.origin)+' '+pick(_TIE), ctx));
  // BEAT 3 — why it guards: chosen or bound, of its will or against it
  const guard=_cvar(key,'guard',()=>{ let s=pick(L.chosen); if(Math.random()<0.5) s+=' '+pick(_CHOSEN_TAG); return _fill(s, ctx); });
  // BEAT 4 — its relationship with the Tower + how it feels (+ epithet/trait/grudge aside)
  const aside=[]; if(nem&&nem.epithet) aside.push(_fill(pick(_BOSS_EPI), ctx)); if(nem&&nem.trait) aside.push(_BOSS_TRAIT(nem.trait));
  if((gr.d||0)>0) aside.push('You have unmade me '+_timesW(gr.d)+' already; the Tower keeps rebuilding what you break, and so do I.');
  if((gr.k||0)>0) aside.push('You have died on this floor '+_timesW(gr.k)+'. I had hoped, this cycle, for one more.');
  const tower=_cvar(key,'tower',()=>{ let s=pick(L.stance)+' '+pick(L.feels); if(aside.length && Math.random()<0.8) s+=' '+pick(aside); return _fill(s, ctx); });
  // BEAT 5 — its attitude to the summit + why it must stop you + farewell
  const summit=_cvar(key,'summit',()=>{ const top=(L.top&&L.top.length && Math.random()<0.62)?pick(L.top):pick(_TOPATT); return _fill(top+' '+pick(_MUSTSTOP)+' '+pick(_CLOSE), ctx); });
  return [
    {art:'boss', color:col, title:nm, body:see},
    {art:'boss', color:col, body:world},
    {art:'boss', color:col, body:guard},
    {art:'boss', color:col, body:tower},
    {art:'boss', color:col, body:summit, last:'⚔ Face the guardian'},
  ]; }
function bossDefeatSlides(e){ const def=e.bossDef||{}; const key=def.key||'warden'; const L=BOSS_LORE[key]||BOSS_LORE.warden; const nem=(typeof nemOf==='function')?nemOf(key):null;
  const nm=(nem&&typeof nemName==='function')?nemName(def,nem):((typeof bossFullName==='function')?bossFullName(def):(def.nm||'THE GUARDIAN'));
  const ai=(typeof storyAct==='function')?storyAct(G.floor):0; const n=(typeof narrFor==='function')?narrFor(ai):{sp:'the dead'};
  const ctx={you:_youWord(key), sp:n.sp, cause:(n.cause||''), ep:(nem&&nem.epithet)||'the nameless'};
  // dying words: the guardian's OWN farewell pool, its composed death line, or the shared pool — all anti-repeated
  const dl=_cvar(key,'death',()=>{ const pools=[]; if(L.death) pools.push(pick(L.death)); if(typeof voiceLine==='function'){ const v=voiceLine(key,'death'); if(v) pools.push(v); } pools.push(pick(_DEATH)); return _fill(pick(pools), ctx); });
  const lan=_cvar(key,'lantern',()=>pick(_LANTERN)({sp:n.sp}));
  const coda=_cvar(key,'coda',()=>_fill(pick(_CODA), ctx));
  return [
    {art:'lantern', color:def.color, body:'<i>'+dl+'</i>'},
    {art:'lantern', color:def.color, title:nm, body:lan+'<br><br>'+coda, last:'Continue'},
  ]; }
