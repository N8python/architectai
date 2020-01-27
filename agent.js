const { Events, Engine, Common, Render, World, Bodies, Body, SAT, Vector, Sleeping } = Matter;
const defaultCategory = 1;
const uniqCategory = 2;
const upperBound = 100;

const random = (min, max) => {
    return Math.random() * (max - min) + min;
}
const bound = (min, max) => {
    return (num) => {
        return Math.min(Math.max(num, min), max);
    }
}
const makeRect = (rects) => {
    let newRect;
    while (true) {
        newRect = {
            x: random(0, 500),
            y: random(0, 500),
            height: random(20, upperBound),
            width: random(20, upperBound)
        };
        let overlap = false;
        rects.forEach(rect => {
            if (newRect.x >= rect.x && newRect.x <= rect.x + rect.width && newRect.y >= rect.y && newRect.y <= rect.y + rect.height) {
                overlap = true;
            }
        })
        if (!overlap) {
            break;
        }
    }
    return newRect;
}
const Agent = (size) => {
    const rects = [];
    for (let i = 0; i < size; i++) {
        rects.push(makeRect(rects))
    }
    const group = Body.nextGroup(false);
    const uniq = Math.random();
    const tweak = (rect) => {
        const newRect = {
            x: bound(0, 500)(rect.x + random(-20, 20)),
            y: bound(0, 500)(rect.y + random(-20, 20)),
            height: bound(20, upperBound)(rect.height + random(-10, 10)),
            width: bound(20, upperBound)(rect.width + random(-10, 10))
        };
        if (Math.random() < 0.05) {
            return makeRect(rects);
        }
        return newRect;
    }
    const tweakDims = (rect) => {
        return {
            x: rect.x,
            y: rect.y,
            height: bound(20, upperBound)(rect.height + random(-10, 10)),
            width: bound(20, upperBound)(rect.width + random(-10, 10))
        }
    }
    return {
        rects,
        uniq,
        toBodies(hidden = false) {
            return rects.map(rect => {
                const b = Bodies.rectangle(...Object.values(rect), {
                    render: {
                        visible: !hidden,
                    },
                    collisionFilter: {
                        mask: defaultCategory,
                        group,
                        category: uniqCategory
                    }
                })
                b.uniq = uniq;
                b.width = rect.width;
                b.height = rect.height;
                return b;
            });
        },
        crossover(other) {
            const agent = Agent(size);
            const index = Math.floor(random(0, rects.length));
            agent.rects = rects.slice(0, index).concat(other.rects.slice(index));
            return agent;
        },
        mutate() {
            const agent = Agent(size);
            agent.rects = rects.map(tweak);
            return agent;
        },
        mutateDims() {
            const agent = Agent(size);
            agent.rects = rects.map(rect => Math.random() <= 0.2 ? tweakDims(rect) : rect);
            return agent;
        }
    }
}