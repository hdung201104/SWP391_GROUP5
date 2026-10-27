import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarkerInstance = null;
let isInitializing = false;
let initPromise = null;

/**
 * Khởi tạo FaceLandmarker từ Google MediaPipe (GPU hoặc CPU fallback)
 * Hoàn toàn miễn phí, chạy 100% Client-side bằng WebAssembly / WebGL
 */
export async function getFaceLandmarker() {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Thử khởi tạo với WebGL GPU trước
      try {
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
        });
        console.info('>> [MediaPipe] Đã nạp thành công mô hình FaceLandmarker (GPU Mode)');
        return faceLandmarkerInstance;
      } catch (gpuError) {
        console.warn('>> [MediaPipe] GPU delegate không khả dụng, chuyển sang CPU fallback...', gpuError);
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
        });
        console.info('>> [MediaPipe] Đã nạp thành công mô hình FaceLandmarker (CPU Fallback)');
        return faceLandmarkerInstance;
      }
    } catch (err) {
      console.error('>> [MediaPipe] Không thể nạp FaceLandmarker:', err);
      faceLandmarkerInstance = null;
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Trích xuất điểm số từ mảng Blendshapes của MediaPipe
 */
function getBlendshapeScore(categories, name) {
  if (!categories || !categories.length) return 0;
  const match = categories.find((c) => c.categoryName === name);
  return match ? match.score : 0;
}

/**
 * Phân tích 1 frame từ Video của Camera bằng MediaPipe FaceLandmarker
 * @param {HTMLVideoElement} video 
 * @param {number} timestamp 
 * @returns {object} Kết quả phân tích (khuôn mặt, ánh mắt, tư thế, cảm xúc)
 */
export function analyzeFaceFrameWithMediaPipe(landmarker, video, timestamp) {
  if (!landmarker || !video || video.readyState < 2 || video.videoWidth === 0) {
    return { faceDetected: false };
  }

  try {
    const results = landmarker.detectForVideo(video, timestamp);
    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      return { faceDetected: false };
    }

    const landmarks = results.faceLandmarks[0];
    const blendshapes = results.faceBlendshapes && results.faceBlendshapes[0] ? results.faceBlendshapes[0].categories : [];

    // 1. Tính toán Bounding Box chính xác cho khuôn mặt
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    // Thêm biên (padding) vừa phải để bao trọn trán và cằm
    const padX = (maxX - minX) * 0.08;
    const padY = (maxY - minY) * 0.12;
    minX = Math.max(0, minX - padX);
    maxX = Math.min(1, maxX + padX);
    minY = Math.max(0, minY - padY);
    maxY = Math.min(1, maxY + padY);

    const faceW = (maxX - minX) * 100;
    const faceH = (maxY - minY) * 100;

    // Do webcam hiển thị dạng gương lật (CSS scale-x-[-1]), tọa độ X trên UI cần đảo chiều:
    const targetX = Math.round((1 - maxX) * 100);
    const targetY = Math.round(minY * 100);
    const targetW = Math.round(Math.max(18, Math.min(50, faceW)));
    const targetH = Math.round(Math.max(22, Math.min(60, faceH)));

    // 2. Phân tích hướng nhìn ánh mắt (Gaze Direction / Iris Tracking) qua Blendshapes
    const eyeLookOutL = getBlendshapeScore(blendshapes, 'eyeLookOutLeft');
    const eyeLookInL = getBlendshapeScore(blendshapes, 'eyeLookInLeft');
    const eyeLookOutR = getBlendshapeScore(blendshapes, 'eyeLookOutRight');
    const eyeLookInR = getBlendshapeScore(blendshapes, 'eyeLookInRight');
    const eyeLookDownL = getBlendshapeScore(blendshapes, 'eyeLookDownLeft');
    const eyeLookDownR = getBlendshapeScore(blendshapes, 'eyeLookDownRight');
    const eyeLookUpL = getBlendshapeScore(blendshapes, 'eyeLookUpLeft');
    const eyeLookUpR = getBlendshapeScore(blendshapes, 'eyeLookUpRight');

    // Độ lệch ánh mắt khỏi màn hình (nhìn sang màn hình phụ, nhìn xuống điện thoại/giấy tờ)
    const gazeDeviationHoriz = Math.max(eyeLookOutL, eyeLookInR, eyeLookInL, eyeLookOutR);
    const gazeDeviationVert = Math.max(eyeLookDownL, eyeLookDownR, eyeLookUpL, eyeLookUpR);
    const totalGazeDeviation = Math.min(1.0, gazeDeviationHoriz * 0.7 + gazeDeviationVert * 0.5);

    // 3. Phân tích tư thế đầu (Head Yaw & Pitch từ 3D Landmarks)
    // Mũi (1), Má trái (234), Má phải (454), Trán (10), Cằm (152)
    const nose = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const forehead = landmarks[10];
    const chin = landmarks[152];

    const distNoseLeft = Math.abs(nose.x - leftCheek.x);
    const distNoseRight = Math.abs(nose.x - rightCheek.x);
    const yawAsymmetry = Math.abs(distNoseLeft - distNoseRight) / (distNoseLeft + distNoseRight + 0.0001);

    const distForeheadNose = Math.abs(nose.y - forehead.y);
    const distNoseChin = Math.abs(chin.y - nose.y);
    const pitchRatio = distForeheadNose / (distNoseChin + 0.0001);

    const isProfile = yawAsymmetry > 0.38; // Quay mặt rõ rệt sang một bên
    const isBowing = pitchRatio > 1.45 || (eyeLookDownL > 0.45 && eyeLookDownR > 0.45); // Cúi đầu hoặc nhìn chằm chằm xuống
    const isLookingUp = pitchRatio < 0.65; // Ngửa đầu lên cao

    // 4. Tính toán % giao tiếp mắt (Eye Contact %) chuẩn xác
    let contactPercent = 95;
    if (isProfile) {
      // Quay mặt sang bên: ánh mắt giảm mạnh còn 15-35%
      contactPercent = Math.round(18 + (1 - Math.min(1, yawAsymmetry * 1.5)) * 16);
    } else if (isBowing) {
      // Cúi nhìn xuống tài liệu/bàn: ánh mắt giảm còn 30-48%
      contactPercent = Math.round(32 + (1 - Math.min(1, totalGazeDeviation)) * 16);
    } else if (isLookingUp) {
      contactPercent = Math.round(50 + (1 - Math.min(1, totalGazeDeviation)) * 15);
    } else {
      // Nhìn thẳng vào webcam/màn hình
      const deduction = Math.round(totalGazeDeviation * 45 + yawAsymmetry * 25);
      contactPercent = Math.max(65, Math.min(98, 98 - deduction));
    }

    // 5. Phân tích cảm xúc khuôn mặt từ Blendshapes thật (Nụ cười, Cau mày, Thư thái)
    const smileL = getBlendshapeScore(blendshapes, 'mouthSmileLeft');
    const smileR = getBlendshapeScore(blendshapes, 'mouthSmileRight');
    const avgSmile = (smileL + smileR) / 2;

    const browDownL = getBlendshapeScore(blendshapes, 'browDownLeft');
    const browDownR = getBlendshapeScore(blendshapes, 'browDownRight');
    const avgBrowDown = (browDownL + browDownR) / 2;

    let emotion = 'Tập trung cao độ 🧐';
    if (avgSmile > 0.35) {
      emotion = 'Mỉm cười & Tự tin 😄';
    } else if (isProfile) {
      emotion = 'Mất tập trung • Cần nhìn vào camera ⚠️';
    } else if (isBowing) {
      emotion = 'Đang suy nghĩ 🤔';
    } else if (avgBrowDown > 0.35) {
      emotion = 'Căng thẳng • Suy nghĩ sâu 🤨';
    } else {
      emotion = 'Tự tin & Chuẩn mực 😊';
    }

    // 6. Xác định trạng thái tư thế
    let posture = 'Cân đối • Nhìn thẳng camera';
    if (isProfile) {
      posture = 'Quay mặt sang bên • Không nhìn camera';
    } else if (isBowing) {
      posture = 'Cúi đầu • Chưa tự tin';
    } else if (isLookingUp) {
      posture = 'Ngửa đầu lên cao';
    }

    return {
      faceDetected: true,
      box: { x: targetX, y: targetY, w: targetW, h: targetH },
      eyeContact: contactPercent,
      posture,
      emotion,
      isProfile,
      smileRatio: avgSmile,
    };
  } catch (err) {
    console.warn('>> [MediaPipe] Lỗi khi xử lý frame:', err);
    return { faceDetected: false };
  }
}
