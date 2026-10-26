import jobApi from '../api/jobApi';
import applicationApi from '../api/applicationApi';
import candidateApi from '../api/candidateApi';

/**
 * Enterprise WebRTC Manager for OpenAI Realtime Voice AI Agent
 * - Manages RTCPeerConnection audio streams and DataChannel
 * - Implements bidirectional natural Vietnamese speech
 * - Handles VAD interruption (barge-in)
 * - Executes platform recruitment function calling tools
 * - Live transcript collection (Whisper & Agent Neural voice)
 */
export class VoiceAgentWebRTCManager {
  constructor() {
    this.peerConnection = null;
    this.dataChannel = null;
    this.localStream = null;
    this.remoteAudio = null;
    this.state = 'idle'; // 'idle' | 'requesting' | 'connecting' | 'connected' | 'listening' | 'thinking' | 'speaking' | 'error'
    this.isMuted = false;
    this.transcripts = [];
    this.currentAssistantMessage = null;
    this.user = null;

    // Callbacks
    this.onStateChange = null;
    this.onTranscriptUpdate = null;
    this.onError = null;
    this.onVolumeChange = null;

    this.audioContext = null;
    this.analyser = null;
    this.animFrameId = null;
  }

  setState(newState) {
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }

  addTranscriptItem(item) {
    this.transcripts = [...this.transcripts, item];
    if (this.onTranscriptUpdate) {
      this.onTranscriptUpdate(this.transcripts);
    }
  }

  updateAssistantTranscript(delta, isFinal = false) {
    if (!this.currentAssistantMessage) {
      this.currentAssistantMessage = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        text: delta || '',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isFinal: isFinal,
      };
      this.transcripts = [...this.transcripts, this.currentAssistantMessage];
    } else {
      if (delta) {
        this.currentAssistantMessage.text += delta;
      }
      if (isFinal) {
        this.currentAssistantMessage.isFinal = true;
      }
      this.transcripts = this.transcripts.map((t) =>
        t.id === this.currentAssistantMessage.id ? { ...this.currentAssistantMessage } : t
      );
    }

    if (isFinal) {
      this.currentAssistantMessage = null;
    }

    if (this.onTranscriptUpdate) {
      this.onTranscriptUpdate(this.transcripts);
    }
  }

  /**
   * Khởi động kết nối WebRTC với OpenAI Realtime Session
   */
  async start({ clientSecret, model = 'gpt-4o-realtime-preview', user = null, callbacks = {} }) {
    this.user = user;
    this.onStateChange = callbacks.onStateChange || null;
    this.onTranscriptUpdate = callbacks.onTranscriptUpdate || null;
    this.onError = callbacks.onError || null;
    this.onVolumeChange = callbacks.onVolumeChange || null;

    try {
      this.setState('requesting');

      // 1. Kiểm tra hỗ trợ WebRTC và xin quyền truy cập Microphone
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt của bạn không hỗ trợ WebRTC hoặc không cho phép truy cập Microphone.');
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 24000,
        },
      });

      this.setState('connecting');

      // 2. Khởi tạo RTCPeerConnection với Google Public STUN
      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
      });

      // 3. Chuẩn bị Audio Element để phát giọng nói AI trả về
      this.remoteAudio = document.createElement('audio');
      this.remoteAudio.autoplay = true;

      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.remoteAudio.srcObject = event.streams[0];
          this.setupAudioVisualizer(event.streams[0]);
        }
      };

      // 4. Thêm Microphone Track vào PeerConnection
      const localAudioTrack = this.localStream.getAudioTracks()[0];
      if (localAudioTrack) {
        this.peerConnection.addTrack(localAudioTrack, this.localStream);
      }

      // 5. Tạo DataChannel "oai-events" để nhận diện sự kiện và xử lý công cụ gọi hàm
      this.dataChannel = this.peerConnection.createDataChannel('oai-events');
      this.setupDataChannel(this.dataChannel);

      // 6. Tạo SDP Offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // 7. Trao đổi SDP trực tiếp với OpenAI Realtime API qua Token ngắn hạn (Ephemeral Token)
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const sdpUrl = `${baseUrl}?model=${encodeURIComponent(model)}`;

      const sdpResponse = await fetch(sdpUrl, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`OpenAI Realtime WebRTC từ chối kết nối (${sdpResponse.status}): ${errorText}`);
      }

      const answerSdp = await sdpResponse.text();
      const answer = {
        type: 'answer',
        sdp: answerSdp,
      };

      await this.peerConnection.setRemoteDescription(answer);
      this.setState('connected');

      // Bắt đầu lời chào đầu tiên từ AI nếu cần
      this.sendEvent({
        type: 'response.create',
        response: {
          modalities: ['audio', 'text'],
          instructions: 'Hãy gửi lời chào mở đầu thân thiện bằng tiếng Việt tới ứng viên và hỏi họ muốn tìm việc làm hay luyện tập phỏng vấn hôm nay.',
        },
      });

    } catch (err) {
      console.error('Lỗi khi thiết lập Voice Realtime Agent:', err);
      this.setState('error');
      if (this.onError) {
        this.onError(err.message || 'Lỗi kết nối Voice Realtime.');
      }
      this.stop();
    }
  }

  /**
   * Cấu hình lắng nghe sự kiện từ OpenAI DataChannel
   */
  setupDataChannel(dc) {
    dc.onopen = () => {
      console.log('OpenAI Realtime DataChannel connected.');
      this.setState('listening');
    };

    dc.onclose = () => {
      console.log('OpenAI Realtime DataChannel closed.');
      if (this.state !== 'error') {
        this.setState('idle');
      }
    };

    dc.onerror = (err) => {
      console.error('DataChannel error:', err);
      if (this.onError) {
        this.onError('Lỗi đường truyền dữ liệu Voice Agent.');
      }
    };

    dc.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        await this.handleRealtimeEvent(data);
      } catch (e) {
        console.warn('Lỗi phân tích gói tin DataChannel:', e);
      }
    };
  }

  /**
   * Bộ điều phối sự kiện Realtime và xử lý ngắt lời (Barge-in)
   */
  async handleRealtimeEvent(event) {
    switch (event.type) {
      // 1. Ứng viên bắt đầu nói -> Kích hoạt Barge-in ngắt lời AI ngay lập tức
      case 'input_audio_buffer.speech_started':
        this.setState('listening');
        // Nếu AI đang nói hoặc đang chuẩn bị phản hồi, lập tức gửi lệnh hủy
        if (this.state === 'speaking' || this.currentAssistantMessage) {
          this.sendEvent({ type: 'response.cancel' });
        }
        break;

      // 2. Ứng viên ngừng nói -> Chuyển sang trạng thái suy nghĩ / xử lý
      case 'input_audio_buffer.speech_stopped':
        this.setState('thinking');
        break;

      // 3. Whisper hoàn thành nhận dạng giọng nói ứng viên thành văn bản tiếng Việt
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript && event.transcript.trim()) {
          this.addTranscriptItem({
            id: 'user_' + Date.now(),
            role: 'candidate',
            text: event.transcript.trim(),
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            isFinal: true,
          });
        }
        break;

      // 4. OpenAI bắt đầu hoặc đang phát âm thanh phản hồi
      case 'output_audio_buffer.started':
      case 'response.audio.started':
        this.setState('speaking');
        break;

      case 'output_audio_buffer.stopped':
      case 'response.audio.done':
        this.setState('listening');
        break;

      // 5. Streaming bản dịch lời nói AI (Assistant Transcript Delta)
      case 'response.audio_transcript.delta':
        if (event.delta) {
          this.updateAssistantTranscript(event.delta, false);
        }
        break;

      case 'response.audio_transcript.done':
        this.updateAssistantTranscript('', true);
        break;

      // 6. Thực thi công cụ tuyển dụng theo yêu cầu của AI (Function Calling)
      case 'response.function_call_arguments.done':
        await this.executeFunctionCall(event);
        break;

      // 7. Xử lý lỗi trả về từ OpenAI
      case 'error':
        console.error('OpenAI Realtime API Error:', event.error);
        if (event.error?.code === 'conversation_already_has_active_response') {
          // Bỏ qua lỗi xung đột khi vừa gửi ngắt lời
          break;
        }
        if (this.onError) {
          this.onError(event.error?.message || 'Lỗi phát sinh trong phiên thoại.');
        }
        break;

      default:
        // Các sự kiện vòng đời khác (session.created, rate_limits.updated,...)
        break;
    }
  }

  /**
   * Gọi các REST API tuyển dụng thực tế trên nền tảng HireMate
   */
  async executeFunctionCall(event) {
    const { call_id, name, arguments: rawArgs } = event;
    let args = {};
    try {
      args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : (rawArgs || {});
    } catch {
      args = {};
    }

    console.log(`[AI Tool Call] Thực thi công cụ: ${name}`, args);
    let outputData = {};

    try {
      if (name === 'search_jobs') {
        const keyword = args.keyword || '';
        const location = args.location || '';
        const res = await jobApi.getJobs(keyword, location);
        const jobList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        // Lấy tối đa 4 công việc nổi bật để phản hồi bằng giọng nói súc tích
        outputData = {
          totalFound: jobList.length,
          topJobs: jobList.slice(0, 4).map((j) => ({
            jobId: j.jobId,
            title: j.title,
            companyName: j.companyName || j.company?.name || 'Doanh nghiệp uy tín',
            location: j.location,
            salaryMin: j.salaryMin,
            salaryMax: j.salaryMax,
            employmentType: j.employmentType,
          })),
        };
      } else if (name === 'get_job_detail') {
        const jobId = args.jobId;
        const res = await jobApi.getJobById(jobId);
        const job = res?.data || res;
        outputData = {
          jobId: job.jobId,
          title: job.title,
          companyName: job.companyName || job.company?.name,
          location: job.location,
          description: job.description?.substring(0, 300) + '...',
          requirements: job.requirements?.substring(0, 300) + '...',
          salaryRange: job.salaryMin && job.salaryMax ? `${job.salaryMin} - ${job.salaryMax} VNĐ` : 'Thỏa thuận',
        };
      } else if (name === 'get_my_applications') {
        const res = await applicationApi.getMyApplications();
        const apps = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        outputData = {
          totalApplications: apps.length,
          applications: apps.slice(0, 5).map((a) => ({
            applicationId: a.applicationId,
            jobTitle: a.job?.title || a.jobTitle,
            companyName: a.job?.companyName || a.companyName,
            status: a.status,
            appliedAt: a.createdAt,
          })),
        };
      } else if (name === 'get_candidate_profile') {
        const candidateId = this.user?.id || this.user?.userId;
        if (candidateId) {
          const res = await candidateApi.getCandidateProfile(candidateId);
          const prof = res?.data || res;
          outputData = {
            candidateName: prof.user?.fullName || this.user?.fullName,
            headline: prof.headline,
            experienceYears: prof.experienceYears,
            skills: prof.skills ? prof.skills.map((s) => s.skillName || s.name) : [],
          };
        } else {
          outputData = { candidateName: this.user?.fullName || 'Ứng viên' };
        }
      } else {
        outputData = { error: `Không tìm thấy công cụ tuyển dụng: ${name}` };
      }
    } catch (apiError) {
      console.error(`Lỗi thực thi công cụ tuyển dụng ${name}:`, apiError);
      outputData = { error: `Lỗi truy xuất hệ thống khi gọi ${name}: ${apiError.message}` };
    }

    // Gửi kết quả công cụ trở lại DataChannel cho OpenAI Realtime Agent
    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: call_id,
        output: JSON.stringify(outputData),
      },
    });

    // Yêu cầu AI tiếp tục trả lời bằng giọng nói dựa trên dữ liệu công cụ vừa nhận được
    this.sendEvent({
      type: 'response.create',
    });
  }

  sendEvent(event) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(event));
    }
  }

  /**
   * Bật/tắt Microphone
   */
  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isMuted = !audioTrack.enabled;
        return this.isMuted;
      }
    }
    return this.isMuted;
  }

  /**
   * Thiết lập bộ đo âm lượng visualizer cho âm thanh
   */
  setupAudioVisualizer(stream) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        if (this.onVolumeChange) {
          this.onVolumeChange(normalized);
        }
        this.animFrameId = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (e) {
      console.warn('Không thể khởi tạo AudioVisualizer:', e);
    }
  }

  /**
   * Ngắt kết nối và giải phóng toàn bộ tài nguyên (Microphone, RTCPeerConnection, AudioContext)
   */
  stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.dataChannel) {
      try {
        this.dataChannel.close();
      } catch {}
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch {}
      this.peerConnection = null;
    }

    if (this.remoteAudio) {
      this.remoteAudio.srcObject = null;
      this.remoteAudio = null;
    }

    this.currentAssistantMessage = null;
    this.setState('idle');
  }
}

export default VoiceAgentWebRTCManager;
