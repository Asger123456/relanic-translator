import { useEffect, useRef } from 'react'

function generateNoiseTexture(size = 256) {
  const data = new Uint8Array(size * size * 4)
  function hash(x, y, s) { let n = x * 374761393 + y * 668265263 + s * 1274126177; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296 }
  function noise(px, py, freq, seed) {
    const fx = (px / size) * freq, fy = (py / size) * freq, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, w = freq | 0
    const v00 = hash(((ix % w) + w) % w, ((iy % w) + w) % w, seed), v10 = hash((((ix + 1) % w) + w) % w, ((iy % w) + w) % w, seed)
    const v01 = hash(((ix % w) + w) % w, (((iy + 1) % w) + w) % w, seed), v11 = hash((((ix + 1) % w) + w) % w, (((iy + 1) % w) + w) % w, seed)
    return v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty) + v01 * (1 - tx) * ty + v11 * tx * ty
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0, amp = 0.4, tot = 0
    for (let o = 0; o < 8; o++) { v += amp * noise(x, y, 32 * (1 << o), o * 31); tot += amp; amp *= 0.65 }
    v /= tot; v = (v - 0.5) * 2.2 + 0.5; v = Math.max(0, Math.min(1, v))
    const val = Math.round(v * 255), idx = (y * size + x) * 4
    data[idx] = val; data[idx + 1] = val; data[idx + 2] = val; data[idx + 3] = 255
  }
  return data
}

const VERT = `attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}`
const FRAG = `
precision highp float;
uniform float uTime,uPupilSize,uIrisWidth,uGlowIntensity,uIntensity,uScale,uNoiseScale,uPupilFollow,uFlameSpeed;
uniform vec2 uResolution,uMouse;uniform vec3 uEyeColor,uBgColor;uniform sampler2D uNoise;
void main(){
  vec2 uv=(gl_FragCoord.xy*2.0-uResolution)/uResolution.y;uv/=uScale;
  float ft=uTime*uFlameSpeed,pr=length(uv)*2.0,pa=(2.0*atan(uv.x,uv.y))/6.2832*0.3;
  vec2 puv=vec2(pr,pa);
  vec4 nA=texture2D(uNoise,puv*vec2(0.2,7.0)*uNoiseScale+vec2(-ft*0.1,0.0));
  vec4 nB=texture2D(uNoise,puv*vec2(0.3,4.0)*uNoiseScale+vec2(-ft*0.2,0.0));
  vec4 nC=texture2D(uNoise,puv*vec2(0.1,5.0)*uNoiseScale+vec2(-ft*0.1,0.0));
  float dm=1.0-length(uv);
  float ir=clamp(-1.0*((dm-0.7)/uIrisWidth),0.0,1.0);
  ir=(ir*dm-0.2)/0.28+nA.r-0.5;ir*=1.3;ir=clamp(ir,0.0,1.0);
  float or2=clamp(-1.0*((dm-0.5)/0.2),0.0,1.0);
  or2=(or2*dm-0.1)/0.38+nC.r-0.5;or2*=1.3;or2=clamp(or2,0.0,1.0);
  ir+=or2;float ie=(dm-0.2)*nB.r*2.0;
  float pupil=1.0-length((uv-uMouse*uPupilFollow*0.12)*vec2(9.0,2.3));
  pupil=clamp(pupil*uPupilSize,0.0,1.0)/0.35;
  float eg=clamp(1.0-length(uv*vec2(0.5,1.5))+0.5,0.0,1.0)+nC.r-0.5;
  float bg=eg;eg=clamp(pow(eg,2.0)+dm,0.0,1.0)*uGlowIntensity;
  eg=clamp(eg,0.0,1.0)*pow(1.0-dm,2.0)*2.5;bg=pow(bg+dm,0.5)*0.15;
  vec3 color=uEyeColor*uIntensity*clamp(max(ir+ie,eg+bg)-pupil,0.0,3.0)+uBgColor;
  gl_FragColor=vec4(color,1.0);
}`

function hexRGB(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
}

export default function EvilEye() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return
    function compile(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s }
    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog); gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, generateNoiseTexture(256))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    gl.uniform1i(gl.getUniformLocation(prog, 'uNoise'), 0)
    gl.uniform1f(gl.getUniformLocation(prog, 'uPupilSize'), 0.6)
    gl.uniform1f(gl.getUniformLocation(prog, 'uIrisWidth'), 0.25)
    gl.uniform1f(gl.getUniformLocation(prog, 'uGlowIntensity'), 0.35)
    gl.uniform1f(gl.getUniformLocation(prog, 'uIntensity'), 1.4)
    gl.uniform1f(gl.getUniformLocation(prog, 'uScale'), 0.82)
    gl.uniform1f(gl.getUniformLocation(prog, 'uNoiseScale'), 1.0)
    gl.uniform1f(gl.getUniformLocation(prog, 'uPupilFollow'), 1.0)
    gl.uniform1f(gl.getUniformLocation(prog, 'uFlameSpeed'), 0.75)
    gl.uniform3fv(gl.getUniformLocation(prog, 'uEyeColor'), hexRGB('#c9a84c'))
    gl.uniform3fv(gl.getUniformLocation(prog, 'uBgColor'), hexRGB('#06060f'))
    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uRes = gl.getUniformLocation(prog, 'uResolution')
    const uMouse = gl.getUniformLocation(prog, 'uMouse')
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e) => { mouse.tx = (e.clientX / window.innerWidth) * 2 - 1; mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1) }
    window.addEventListener('mousemove', onMove)
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uRes, canvas.width, canvas.height) }
    window.addEventListener('resize', resize); resize()
    let raf
    const draw = (t) => { raf = requestAnimationFrame(draw); mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05; gl.uniform1f(uTime, t * 0.001); gl.uniform2f(uMouse, mouse.x, mouse.y); gl.drawArrays(gl.TRIANGLES, 0, 3) }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, display: 'block', pointerEvents: 'none' }} />
}
