class Particle {
  acceleration;
  velocity;
  // position;
  lifespan;
  constructor(position) {
    this.acceleration = p5Data.createVector(0, 0);
    this.velocity = p5Data.createVector(0, 0);
    // this.position = position.copy();
  }
}

class ChargeForceSystem {//物理系统，只负责处理粒子的物理属性。
  constant_charge = 400;
  coefficient_forceback = 0.1;
  constructor() {
  }
  run(nodes, chargeC) {
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        let pi = nodes[i];
        let pj = nodes[j];
        let dist = p5.Vector.dist(pi.position, pj.position);
        let force;
        //边界约束
        if (dist < pi.maxRadius + pj.maxRadius + Math.min(pi.maxRadius, pj.maxRadius) / 2) {
          dist = dist - pi.maxRadius - pj.maxRadius;
          dist = Math.max(dist, 20);
          force = p5.Vector.sub(pi.position, pj.position).setMag((chargeC ? chargeC : this.constant_charge) / (dist * dist + 1));
        } else
          force = p5Data.createVector(0, 0);

        if (pi.groupBelong)
          pi.groupBelong.addForce(force);
        // else
          
        let antiForce = force.copy().rotate(180);
        if (pj.groupBelong)
          pj.groupBelong.addForce(antiForce);
        // else
        if(pi.groupBelong==pj.groupBelong){
          pi.addForce(force);
          pj.addForce(antiForce);
        }
          
      }
    }

    elementGroups.forEach((group) => {
      let particle = group.particle;
      particle.velocity.mult(this.coefficient_forceback);
      particle.velocity.add(particle.acceleration);
      group.move(particle.velocity);
      particle.acceleration.mult(0);
    })
    for (let i = 0; i < nodes.length; i++) {
      // if(nodes[i].groupBelong) continue;
      let particle = nodes[i].particle;
      particle.velocity.mult(this.coefficient_forceback);
      particle.velocity.add(particle.acceleration);
      nodes[i].move(particle.velocity);
      particle.acceleration.mult(0);
    }
  }
}
