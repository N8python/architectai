const posOf = body => {
    return {
        x: body.position.x,
        y: body.position.y
    }
}
const engine = Engine.create();
const render = Render.create({
    element: document.body,
    engine
});
const scores = {};
const popsize = 32;
let population = Array(popsize).fill(() => Agent(5)).map(x => x());
let cannonBall = Bodies.circle(1000, 400, 30, 30);
Sleeping.set(cannonBall, true)
let tick = 0;
let idx = 0;
let generation = 1;
let highestAlt = 610;
let rects;
let champ;
const stats = document.getElementById("stats");
const elitism = 3;
const chooseParent = (pop) => {
    const fitnessSum = Object.values(scores).reduce((t, v) => t + v);
    let threshold = random(0, fitnessSum);
    let sum = 0;
    const choice = pop.sort(() => Math.random() - 0.5).find(agent => {
        sum += agent.fitness;
        if (sum > threshold) {
            return true;
        }
    }) || pop.sort((a, b) => b.fitness - a.fitness)[0];
    return choice;
}
setInterval(() => {
    stats.innerHTML = `Generation: ${generation}`;
    tick++;
    /*if (tick === 30) {
        Sleeping.set(cannonBall, false)
        Body.applyForce(cannonBall, posOf(cannonBall), { x: -0.3, y: 0 })
    }*/
    const atRest = rects.every(body => {
        const { x, y } = body.velocity;
        return Math.abs(x) < 0.001 && Math.abs(y) < 0.001 || body.position.x < 0;
    })
    if (atRest || tick > 100) {
        /*rects.forEach(rect => {
            World.remove(engine.world, rect);
        })
        World.remove(engine.world, cannonBall);
        cannonBall = Bodies.circle(1000, 400, 30, 30);
        Sleeping.set(cannonBall, true);
        idx = 0;
        const old = population;
        population = population.sort((a, b) => b.fitness - a.fitness).slice(0, elitism).concat((Array(popsize - elitism).fill(() => chooseParent(old).mutate()).map(x => x())));
        rects = population[idx].toBodies();
        World.add(engine.world, [...rects, cannonBall])
        generation += 1;
        tick = 0;
        */
        population.forEach((agent, idx) => {
            let lowest = Infinity;
            let touchingGround = 0;
            let combinedHeight = 1;
            let rectanglesTouching = 1;
            rects.filter(rect => rect.uniq === agent.uniq).forEach(body => {
                const { vertices } = body;
                vertices.forEach(({ y }) => {
                    if (y < lowest) {
                        lowest = y;
                    }
                })
                combinedHeight += body.height;
                const { collided } = SAT.collides(body, ground);
                if (collided) {
                    touchingGround += 1;
                }
                rects.filter(rect => rect.uniq === agent.uniq).forEach(rect => {
                    const { collided } = SAT.collides(body, rect);
                    if (collided) {
                        rectanglesTouching += 1;
                    }
                })
            })
            if (lowest < 0) {
                lowest = 600;
            } else {
                if (lowest < highestAlt) {
                    champ = population[idx];
                    highestAlt = lowest;
                }
            }
            if (touchingGround === 0) {
                touchingGround = 1;
            }
            const fitness = ((600 - lowest) ** 5) / (touchingGround ** 4) * combinedHeight * rectanglesTouching ** 3;
            console.log(lowest, touchingGround, combinedHeight, rectanglesTouching)
            console.log(fitness);
            scores[idx] = fitness;
            population[idx].fitness = fitness;
        });
        rects.forEach(rect => {
            World.remove(engine.world, rect);
        })
        World.remove(engine.world, cannonBall);
        cannonBall = Bodies.circle(1000, 400, 30, 30);
        Sleeping.set(cannonBall, true);
        const old = population.sort((a, b) => b.fitness - a.fitness);
        population = []; //population.sort((a, b) => b.fitness - a.fitness).slice(0, elitism).concat((Array(popsize - elitism).fill(() => chooseParent(old).mutate()).map(x => x())));
        for (let i = 0; i < popsize; i++) {
            if (i < elitism) {
                population.push(old[i]);
            } else if (i < elitism * 2) {
                population.push(old[i - elitism].mutateDims());
                console.log(population[i], population[i - elitism])
            } else {
                population.push(chooseParent(old).mutate());
            }
        }
        rects = [];
        population.forEach((agent, idx) => {
            if (idx === 0) {
                rects.push(...agent.toBodies());
            } else {
                rects.push(...agent.toBodies({
                    hidden: true
                }));
            }
        })
        World.add(engine.world, rects);
        generation += 1;
        tick = 0;
    }
}, 30)
rects = [];
population.forEach(agent => {
    rects.push(...agent.toBodies());
})
const ground = Bodies.rectangle(400, 610, 1620, 60, {
    collisionFilter: {
        category: defaultCategory
    },
    isStatic: true
});
World.add(engine.world, [...rects, cannonBall, ground]);
Events.on(render, "afterRender", () => {
    render.context.strokeStyle = "green";
    render.context.beginPath();
    render.context.moveTo(0, highestAlt);
    render.context.lineTo(800, highestAlt);
    render.context.stroke();
});
Engine.run(engine);
Render.run(render);