import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import App from "../App";
import PaperNote from "../components/PaperNote";
import { getEnvironmentComposition } from "../config/environmentCompositionConfig";
import { getConstellationByKey } from "../config/presetConstellationConfig";
import { projectConstellationNodes } from "../utils/constellationProjection";

vi.setConfig({ testTimeout: 60000 });

const originalFetch = globalThis.fetch;

describe("指尖星空演示闭环", () => {
  function mockCameraStream() {
    const stop = vi.fn();
    const stream = {
      getTracks: () => [{ stop }]
    };
    const getUserMedia = vi.fn().mockResolvedValue(stream);

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia }
    });

    return { getUserMedia, stop, stream };
  }

  function todayAt(time) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day} ${time}`;
  }

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
  });

  test("用户记录情绪后生成完整 record，并通过投掷回写 star 后可点击回看", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    expect(screen.queryByRole("heading", { name: "写下此刻的心情" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "信纸" })).toHaveAttribute("src", "/assets/objects/paper_flat.png");
    await user.type(screen.getByLabelText("想交给星空的话"), "今天有点累，但我想把它交给星空");
    await user.click(screen.getByRole("button", { name: "非常难过" }));
    await user.click(screen.getByRole("button", { name: "完成" }));

    const savedAfterCreate = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
    expect(savedAfterCreate).toHaveLength(1);
    expect(savedAfterCreate[0]).toMatchObject({
      text: "今天有点累，但我想把它交给星空",
      emotion: "verySad",
      star: null,
      title: "",
      aiSuggestedEmotion: "",
      favorite: false,
      deleted: false,
      audioUrl: "",
      imageUrl: "",
      diaryBookId: "default",
      gestureCreated: false
    });

    expect(screen.queryByText("等待折成纸团")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    expect(screen.getByRole("img", { name: "纸团" })).toHaveAttribute("src", "/assets/objects/paper_ball.png");

    expect(screen.queryByRole("button", { name: "投向星空" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("img", { name: "纸团" }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
      expect(saved[0].star).not.toBeNull();
    });

    const savedAfterThrow = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
    expect(savedAfterThrow[0].star).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^star_/),
        x: expect.any(Number),
        y: expect.any(Number)
      })
    );
    const foreground = document.querySelector(".foreground-emotion-verySad .scene-emotion-group");
    expect(foreground).toHaveAttribute("src", expect.stringContaining("/assets/scene-layers/emotion-groups/verySad_group.png"));

    await user.click(screen.getByRole("button", { name: /查看星星/ }));
    const dialog = screen.getByRole("dialog", { name: "星星详情" });
    expect(within(dialog).getByText("今天有点累，但我想把它交给星空")).toBeInTheDocument();
    expect(within(dialog).getByText("非常难过")).toBeInTheDocument();
  });

  test("刷新后从 localStorage 恢复星星并仍可回看", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "fingertip_starry_sky_records",
      JSON.stringify([
        {
          id: "record_demo",
          text: "这是刷新后还在的星星",
          emotion: "happy",
          createdAt: "2026-04-25 21:00:00",
          star: { id: "star_demo", x: 320, y: 140 },
          title: "",
          aiSuggestedEmotion: "",
          aiFeedback: "这颗星星已经替你收下了今天的心情。",
          favorite: false,
          deleted: false,
          audioUrl: "",
          imageUrl: "",
          diaryBookId: "default",
          gestureCreated: false
        }
      ])
    );

    render(<App />);

    await user.click(screen.getByRole("button", { name: /查看星星/ }));
    expect(screen.getByText("这是刷新后还在的星星")).toBeInTheDocument();
  });

  test("纸条和纸团流程不再显示外层卡片容器", async () => {
    const user = userEvent.setup();
    const record = {
      id: "record_visual",
      text: "111",
      emotion: "calm",
      star: null
    };
    function ControlledPaperNote() {
      const [isFolded, setIsFolded] = React.useState(false);

      return (
        <PaperNote
          record={record}
          isFolded={isFolded}
          isThrowing={false}
          onFold={() => setIsFolded(true)}
          onThrow={vi.fn()}
        />
      );
    }

    const { container } = render(<ControlledPaperNote />);

    expect(container.querySelector(".paper-note-scene")).toBeInTheDocument();
    expect(container.querySelector(".paper-note")).not.toBeInTheDocument();
    expect(screen.queryByText("等待折成纸团")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "折成纸团" }));

    expect(container.querySelector(".paper-ball-scene")).toBeInTheDocument();
    expect(container.querySelector(".paper-ball")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "投向星空" })).not.toBeInTheDocument();
  });

  test("手势抓住纸团后显示锁定反馈而不是要求持续追随手", () => {
    const record = {
      id: "record_gesture_throw_lock",
      text: "throw lock",
      emotion: "calm",
      star: null
    };

    const { container } = render(
      <PaperNote
        record={record}
        isFolded
        isThrowing={false}
        gesturePointer={{ x: 320, y: 240 }}
        onThrow={vi.fn()}
      />
    );

    expect(container.querySelector(".paper-ball-scene")).toHaveClass("is-gesture-grabbed");
    expect(screen.getByText(/手可以放稳/)).toBeInTheDocument();
  });

  test("待折纸条可以取消并撤回未投掷记录", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "先不投了");
    await user.click(screen.getByRole("button", { name: "完成" }));

    expect(JSON.parse(localStorage.getItem("fingertip_starry_sky_records"))).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "取消" }));

    expect(screen.queryByRole("button", { name: "折成纸团" })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("fingertip_starry_sky_records"))).toHaveLength(0);
  });

  test("记录弹窗使用无外框的信纸浮层", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));

    expect(container.querySelector(".paper-writing-modal")).toBeInTheDocument();
    expect(container.querySelector(".paper-writing-scene")).toBeInTheDocument();
    expect(container.querySelector(".diary-modal")).not.toBeInTheDocument();
    expect(screen.queryByText("等待折成纸团")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "关闭" })).not.toBeInTheDocument();
    expect(container.querySelector(".paper-button-row")).toBeInTheDocument();
  });

  test("用户可以选择六类情绪，投掷后回看显示正确情绪标签", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));

    for (const label of ["开心", "平静", "委屈", "生气", "非常难过", "焦虑"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }

    await user.type(screen.getByLabelText("想交给星空的话"), "今天心里有一点闷。");
    await user.click(screen.getByRole("button", { name: "非常难过" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
      expect(saved[0].star).not.toBeNull();
      expect(saved[0].emotion).toBe("verySad");
    });

    await user.click(screen.getByRole("button", { name: /查看星星/ }));
    const dialog = screen.getByRole("dialog", { name: "星星详情" });
    expect(within(dialog).getByText("非常难过")).toBeInTheDocument();
    expect(within(dialog).getByText(/场景正在慢慢恢复平静/)).toBeInTheDocument();
  }, 10000);

  test("AI 可以辅助感知情绪，成功后选中对应情绪且用户仍可手动修改", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        emotion: "happy",
        confidence: 0.86,
        message: "小伙伴感觉到了，你的这封信里藏着一点「开心」。"
      })
    });
    globalThis.fetch = fetchSpy;

    render(<App />);
    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "今天收到了很温柔的回应，心里亮了一小片星光。");
    await user.click(screen.getByRole("button", { name: /让远方的小伙伴轻轻感受一下你的心情/ }));

    await waitFor(() => {
      expect(screen.getByText("小伙伴感觉到了，你的这封信里藏着一点「开心」。")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "开心" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "非常难过" }));
    expect(screen.getByRole("button", { name: "非常难过" })).toHaveAttribute("aria-pressed", "true");
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/detect-emotion",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letterContent: "今天收到了很温柔的回应，心里亮了一小片星光。" })
      })
    );
  });

  test("信太短时 AI 不请求接口并给出温柔提示", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok", stars: [] })
    });
    globalThis.fetch = fetchSpy;

    render(<App />);
    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "还好");
    await user.click(screen.getByRole("button", { name: /让远方的小伙伴轻轻感受一下你的心情/ }));

    expect(screen.getByText("再和小伙伴多说一点吧，它还没有听清你的心声。")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalledWith("/api/detect-emotion", expect.anything());
  });

  test("英文长信也会进入 AI 感知流程", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "uncertain",
        emotion: null,
        confidence: 0.42,
        message: "小伙伴还没有完全听清你的心声，再和它多说说你的想法吧。"
      })
    });
    globalThis.fetch = fetchSpy;

    render(<App />);
    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "I feel quietly relieved after a long and difficult day.");
    await user.click(screen.getByRole("button", { name: /让远方的小伙伴轻轻感受一下你的心情/ }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  test("投掷后主场景显示当前情绪对应的狐狸和玫瑰素材", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "有一点委屈，但想被好好接住。");
    await user.click(screen.getByRole("button", { name: "委屈" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
      expect(saved[0].star).not.toBeNull();
      expect(saved[0].emotion).toBe("wronged");
      expect(document.querySelector(".foreground-emotion-wronged .scene-emotion-group")).toHaveAttribute(
        "src",
        expect.stringContaining("/assets/scene-layers/emotion-groups/wronged_group.png")
      );
    });

    expect(document.querySelector(".scene-foreground-platform")).toHaveAttribute(
      "src",
      expect.stringContaining("/assets/scene-layers/platforms/")
    );
  });

  test("观测星空会为难过类星星显示泪湖座，并保持星星回看", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "fingertip_starry_sky_records",
      JSON.stringify([
        {
          id: "record_1",
          text: "第一颗委屈星星",
          emotion: "wronged",
          createdAt: "2026-04-29 12:00:00",
          star: { id: "star_1", x: 120, y: 120 }
        },
        {
          id: "record_2",
          text: "第二颗委屈星星",
          emotion: "wronged",
          createdAt: "2026-04-29 12:01:00",
          star: { id: "star_2", x: 220, y: 150 }
        },
        {
          id: "record_3",
          text: "第三颗委屈星星",
          emotion: "verySad",
          createdAt: "2026-04-29 12:02:00",
          star: { id: "star_3", x: 320, y: 110 }
        }
      ])
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: "观测星空" }));

    expect(screen.getByRole("region", { name: "观测星空" })).toBeInTheDocument();
    expect(document.querySelector(".preset-constellation-layer")).toBeInTheDocument();
    expect(document.querySelector(".preset-constellation-outline line")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /查看星星/ })[0]);
    expect(screen.getByRole("dialog", { name: "星星详情" })).toBeInTheDocument();
  });

  test("观测星空支持情绪筛选、日期筛选和统计", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "fingertip_starry_sky_records",
      JSON.stringify([
        {
          id: "record_happy_today",
          text: "今天很亮",
          emotion: "happy",
          createdAt: todayAt("12:00:00"),
          star: { id: "star_happy_today", x: 120, y: 120 }
        },
        {
          id: "record_sad_today",
          text: "今天很难过",
          emotion: "verySad",
          createdAt: todayAt("12:01:00"),
          star: { id: "star_sad_today", x: 220, y: 150 }
        },
        {
          id: "record_sad_old",
          text: "很久以前的难过",
          emotion: "verySad",
          createdAt: "2026-04-20 12:01:00",
          star: { id: "star_sad_old", x: 320, y: 170 }
        }
      ])
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: "观测星空" }));

    const panel = screen.getByRole("region", { name: "观测控制" });
    expect(within(panel).getByText("总星星 3")).toBeInTheDocument();
    expect(within(panel).getByText("当前筛选 3")).toBeInTheDocument();

    await user.selectOptions(within(panel).getByLabelText("情绪筛选"), "verySad");
    expect(within(panel).getByText("当前筛选 2")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /查看星星：非常难过/ })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /查看星星：开心/ })).not.toBeInTheDocument();

    await user.selectOptions(within(panel).getByLabelText("日期筛选"), "today");
    expect(within(panel).getByText("当前筛选 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /查看星星：非常难过/ }));
    expect(screen.getByRole("dialog", { name: "星星详情" })).toBeInTheDocument();
  });

  test("改变环境按钮打开可关闭的环境面板", async () => {
    const user = userEvent.setup();
    const stopSpy = vi.fn();
    class MockAudioNode {
      connect() {
        return this;
      }
      disconnect() {}
      start() {}
      stop = stopSpy;
    }
    class MockAudioContext {
      currentTime = 0;
      destination = new MockAudioNode();
      createGain() {
        return { gain: { value: 0.2, setTargetAtTime: vi.fn() }, connect: vi.fn() };
      }
      createBuffer() {
        return { getChannelData: () => new Float32Array(128) };
      }
      createBufferSource() {
        return new MockAudioNode();
      }
      createBiquadFilter() {
        return new MockAudioNode();
      }
      createOscillator() {
        const node = new MockAudioNode();
        node.frequency = { value: 0 };
        return node;
      }
      resume() {
        return Promise.resolve();
      }
      close() {
        return Promise.resolve();
      }
    }
    window.AudioContext = MockAudioContext;
    window.webkitAudioContext = MockAudioContext;

    render(<App />);

    await user.click(screen.getByRole("button", { name: "改变环境" }));

    const panel = screen.getByRole("dialog", { name: "环境面板" });
    expect(within(panel).getByRole("button", { name: "雨夜星空" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "炉边星空" })).toBeInTheDocument();
    expect(within(panel).getAllByRole("img", { name: /平静.*星空场景/ })).toHaveLength(4);
    expect(within(panel).getByRole("button", { name: "雨声" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "篝火" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "海浪" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "摇篮曲" })).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "雨声" }));
    await user.click(within(panel).getByRole("button", { name: "播放白噪音" }));
    expect(within(panel).getByText("播放中")).toBeInTheDocument();

    fireEvent.change(within(panel).getByLabelText("环境音量"), { target: { value: "42" } });
    expect(within(panel).getByText("42%")).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "关闭环境面板" }));
    expect(screen.queryByRole("dialog", { name: "环境面板" })).not.toBeInTheDocument();
    expect(stopSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "改变环境" }));
    expect(within(screen.getByRole("dialog", { name: "环境面板" })).getByText("播放中")).toBeInTheDocument();
  });

  test("投掷后出现焦虑泡泡恢复物件，点击后场景回到平静", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "脑子里有很多绕来绕去的声音。");
    await user.click(screen.getByRole("button", { name: "焦虑" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));

    await waitFor(() => {
      expect(container.querySelector(".recovery-interaction-layer")).toBeInTheDocument();
      expect(container.querySelector(".cloud-mist-field")).toBeInTheDocument();
      expect(container.querySelectorAll(".cloud-knead-button")).toHaveLength(0);
    });

    const mist = container.querySelector(".cloud-mist-field");
    fireEvent.pointerDown(mist, { clientX: 160, clientY: 170, pointerId: 1 });
    fireEvent.pointerMove(mist, { clientX: 420, clientY: 240, pointerId: 1 });
    fireEvent.pointerMove(mist, { clientX: 170, clientY: 270, pointerId: 1 });
    fireEvent.pointerMove(mist, { clientX: 450, clientY: 340, pointerId: 1 });
    fireEvent.pointerUp(mist, { clientX: 450, clientY: 340, pointerId: 1 });

    await new Promise((resolve) => setTimeout(resolve, 5600));

    await waitFor(() => {
      expect(document.querySelector(".drift-publish-prompt")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "只是自己留着" }));

    await waitFor(
      () => {
        expect(container.querySelector(".foreground-scene-lullaby .scene-emotion-group")).toHaveAttribute(
          "src",
          expect.stringContaining("/assets/scene-layers/emotion-groups/calm_group.png")
        );
      },
      { timeout: 2200 }
    );
  });

  test("星星详情支持收藏和软删除并写入 localStorage", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "fingertip_starry_sky_records",
      JSON.stringify([
        {
          id: "record_manage",
          text: "想留住也可以放下的一颗星",
          emotion: "calm",
          createdAt: "2026-05-05 20:00:00",
          star: { id: "star_manage", x: 210, y: 150 },
          favorite: false,
          deleted: false
        }
      ])
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: /查看星星：平静/ }));

    const dialog = screen.getByRole("dialog", { name: "星星详情" });
    expect(within(dialog).getByText("静环座")).toBeInTheDocument();
    expect(within(dialog).getByText("2026-05-05")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "收藏星星" }));
    expect(JSON.parse(localStorage.getItem("fingertip_starry_sky_records"))[0].favorite).toBe(true);
    expect(within(dialog).getByRole("button", { name: "取消收藏" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "删除星星" }));
    const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
    expect(saved[0].deleted).toBe(true);
    expect(screen.queryByRole("button", { name: /查看星星：平静/ })).not.toBeInTheDocument();
  });

  test("手势实验入口默认不影响主流程，权限失败时提供键鼠兜底", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("denied"))
      }
    });

    render(<App />);
    expect(screen.getByRole("button", { name: "记录情绪" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "手势实验" }));
    const panel = screen.getByRole("dialog", { name: "手势实验" });
    expect(within(panel).getByText("摄像头未开启")).toBeInTheDocument();
    expect(panel.closest(".modal-backdrop")).not.toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "开启摄像头实验" }));
    expect(await within(panel).findByText(/摄像头权限不可用/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "记录情绪" })).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "关闭手势实验" }));
    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    expect(screen.getByLabelText("想交给星空的话")).toBeInTheDocument();
  });

  test("打开手势实验小窗后主流程按钮仍然可点击", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "手势实验" }));

    const panel = screen.getByRole("dialog", { name: "手势实验" });
    expect(panel).toHaveClass("gesture-monitor-panel");
    expect(panel.closest(".modal-backdrop")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "记录情绪" }));

    expect(screen.getByLabelText("想交给星空的话")).toBeInTheDocument();
  });

  test("模拟 OK 可以打开记录情绪信纸", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "手势实验" }));
    const panel = screen.getByRole("dialog", { name: "手势实验" });

    expect(within(panel).getByText("OK 手势：打开记录情绪的信纸。")).toBeInTheDocument();
    expect(within(panel).getAllByText(/摄像头只用于本地识别手部关键点/).length).toBeGreaterThan(0);

    await user.click(within(panel).getByRole("button", { name: "OK" }));
    expect(screen.getByLabelText("想交给星空的话")).toBeInTheDocument();
    expect(document.querySelector(".wish-trail-layer")).not.toBeInTheDocument();
  });

  test("摄像头授权成功后手势面板显示实时预览区域", async () => {
    const user = userEvent.setup();
    const { getUserMedia, stream, stop } = mockCameraStream();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "手势实验" }));
    const panel = screen.getByRole("dialog", { name: "手势实验" });

    expect(within(panel).getByText("摄像头未开启")).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "开启摄像头实验" }));

    const video = await within(panel).findByLabelText("摄像头实时预览");
    expect(getUserMedia).toHaveBeenCalledWith({ video: true });
    expect(video.srcObject).toBe(stream);
    expect(stop).not.toHaveBeenCalled();
  });

  test("开启摄像头后仍然能点击记录情绪", async () => {
    const user = userEvent.setup();
    mockCameraStream();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "手势实验" }));
    const panel = screen.getByRole("dialog", { name: "手势实验" });
    await user.click(within(panel).getByRole("button", { name: "开启摄像头实验" }));
    await within(panel).findByLabelText("摄像头实时预览");

    await user.click(screen.getByRole("button", { name: "记录情绪" }));

    expect(screen.getByLabelText("想交给星空的话")).toBeInTheDocument();
  });

  test("关闭手势面板时会停止摄像头轨道", async () => {
    const user = userEvent.setup();
    const { stop } = mockCameraStream();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "手势实验" }));
    const panel = screen.getByRole("dialog", { name: "手势实验" });
    await user.click(within(panel).getByRole("button", { name: "开启摄像头实验" }));
    await within(panel).findByLabelText("摄像头实时预览");

    await user.click(within(panel).getByRole("button", { name: "关闭手势实验" }));

    expect(stop).toHaveBeenCalledTimes(1);
  });

  test("模拟五指合拢会真的把待投掷纸条折成纸团", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "用模拟按钮折一下");
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "手势实验" }));

    const panel = screen.getByRole("dialog", { name: "手势实验" });
    await user.click(within(panel).getByRole("button", { name: "五指合拢" }));

    expect(screen.getByRole("img", { name: "纸团" })).toBeInTheDocument();
  });

  test("模拟投掷会触发当前纸团阶段动作", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "用捏合投出去");
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("button", { name: "手势实验" }));

    const panel = screen.getByRole("dialog", { name: "手势实验" });
    await user.click(within(panel).getByRole("button", { name: "投掷" }));

    expect(screen.getByRole("img", { name: "纸团" })).toHaveClass("throwing-animation");
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
      expect(saved[0].star).not.toBeNull();
    });
  });

  test("恢复阶段模拟五指合拢揉云会安放当前星星并回到平静", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "手势实验" }));
    const panel = screen.getByRole("dialog", { name: "手势实验" });
    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByLabelText("想交给星空的话"), "投出去以后用手势恢复");
    await user.click(screen.getByRole("button", { name: "焦虑" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));

    await waitFor(() => {
      expect(document.querySelector(".recovery-interaction-layer")).toBeInTheDocument();
      expect(within(panel).getByText("五指合拢并揉动：推动当前恢复互动。")).toBeInTheDocument();
    });

    await user.click(within(panel).getByRole("button", { name: "五指合拢" }));

    await waitFor(() => {
      expect(document.querySelector(".drift-publish-prompt")).toBeInTheDocument();
    }, { timeout: 6000 });

    await user.click(screen.getByRole("button", { name: "只是自己留着" }));

    await waitFor(() => {
      expect(document.querySelector(".foreground-scene-lullaby .scene-foreground-stage")).toBeInTheDocument();
    });
  });

  test("投掷后出现专属恢复物件，点击足够数量后安放星星并回到平静", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByRole("textbox"), "some wronged feeling to be held by the sky");
    await user.click(screen.getByRole("button", { name: "委屈" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("fingertip_starry_sky_records"))).toHaveLength(1);
    });
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
      expect(saved[0].star).not.toBeNull();
    });

    await waitFor(() => {
      expect(container.querySelector(".recovery-interaction-layer")).toBeInTheDocument();
      expect(container.querySelectorAll(".recovery-object")).toHaveLength(2);
      expect(container.querySelector(".recovery-drop-target")).toBeInTheDocument();
    });

    const target = container.querySelector(".recovery-drop-target");
    const targetX = Number.parseFloat(target.style.left);
    const targetY = Number.parseFloat(target.style.top);
    for (const button of Array.from(container.querySelectorAll(".recovery-object")).slice(0, 2)) {
      fireEvent.mouseDown(button, { clientX: targetX - 30, clientY: targetY - 30, pageX: targetX - 30, pageY: targetY - 30 });
      fireEvent.mouseMove(window, { clientX: targetX, clientY: targetY, pageX: targetX, pageY: targetY });
      fireEvent.mouseUp(window, { clientX: targetX, clientY: targetY, pageX: targetX, pageY: targetY });
    }

    await waitFor(() => {
      expect(screen.getByText("雨滴被星空接住了。")).toBeInTheDocument();
    });

    await new Promise((resolve) => setTimeout(resolve, 1200));

    await waitFor(() => {
      expect(document.querySelector(".drift-publish-prompt")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "只是自己留着" }));

    await waitFor(
      () => {
        expect(container.querySelector('.scene-emotion-group[src*="calm_group.png"]')).toBeInTheDocument();
      },
      { timeout: 2200 }
    );
  });

  test("环境面板展示当前情绪的四个星空场景变体，选择场景不会自动播放白噪音", async () => {
    const user = userEvent.setup();
    const stopSpy = vi.fn();
    class MockAudioNode {
      connect() {
        return this;
      }
      disconnect() {}
      start = vi.fn();
      stop = stopSpy;
    }
    class MockAudioContext {
      currentTime = 0;
      destination = new MockAudioNode();
      createGain() {
        return { gain: { value: 0.2, setTargetAtTime: vi.fn() }, connect: vi.fn() };
      }
      createBuffer() {
        return { getChannelData: () => new Float32Array(128) };
      }
      createBufferSource() {
        return new MockAudioNode();
      }
      createBiquadFilter() {
        return new MockAudioNode();
      }
      createOscillator() {
        const node = new MockAudioNode();
        node.frequency = { value: 0 };
        return node;
      }
      resume() {
        return Promise.resolve();
      }
      close() {
        return Promise.resolve();
      }
    }
    window.AudioContext = MockAudioContext;
    window.webkitAudioContext = MockAudioContext;

    localStorage.setItem(
      "fingertip_starry_sky_records",
      JSON.stringify([
        {
          id: "record_env_wronged",
          text: "想换一个能接住委屈的星空",
          emotion: "wronged",
          createdAt: "2026-05-11 20:00:00",
          star: { id: "star_env_wronged", x: 220, y: 150 },
          favorite: false,
          deleted: false
        }
      ])
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: "改变环境" }));

    const panel = screen.getByRole("dialog", { name: "环境面板" });
    expect(within(panel).getByRole("button", { name: "雨夜星空" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "炉边星空" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "海浪星空" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "摇篮星空" })).toBeInTheDocument();
    expect(within(panel).getAllByRole("img", { name: /委屈.*星空场景/ })).toHaveLength(4);

    await user.click(within(panel).getByRole("button", { name: "炉边星空" }));

    expect(screen.queryByRole("dialog", { name: "环境面板" })).not.toBeInTheDocument();
    expect(stopSpy).not.toHaveBeenCalled();
  });

  test("选择环境后主星空立即切换 composition，并把星星层限制在天空区域", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    expect(container.querySelector(".main-scene")).toHaveAttribute("data-scene-key", "lullaby");
    expect(container.querySelector(".environment-layer-base")).not.toBeInTheDocument();
    expect(container.querySelector(".scene-environment-lullaby")).toBeInTheDocument();
    expect(container.querySelector('.scene-foreground-platform[src*="lullaby_platform.png"]')).toBeInTheDocument();
    expect(container.querySelector('.scene-emotion-group[src*="calm_group.png"]')).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "改变环境" }));
    const panel = screen.getByRole("dialog", { name: "环境面板" });
    await user.click(within(panel).getByRole("button", { name: "海浪星空" }));

    expect(container.querySelector(".main-scene")).toHaveAttribute("data-scene-key", "waves");
    expect(container.querySelector(".environment-layer-base")).not.toBeInTheDocument();
    expect(container.querySelector(".scene-environment-waves")).toBeInTheDocument();
    expect(container.querySelector('.scene-foreground-platform[src*="waves_platform.png"]')).toBeInTheDocument();
    expect(container.querySelector('.scene-emotion-group[src*="calm_group.png"]')).toBeInTheDocument();
    expect(container.querySelector(".star-layer")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "环境面板" })).not.toBeInTheDocument();
  });

  test("纸团投掷会生成朝向目标星座点的流星轨迹", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByRole("textbox"), "想看见纸团飞成一颗星");
    await user.click(screen.getByRole("button", { name: "开心" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));

    const meteor = container.querySelector(".paper-meteor-trail");
    expect(meteor).toBeInTheDocument();
    expect(meteor.style.getPropertyValue("--meteor-target-x")).toMatch(/px$/);
    expect(meteor.style.getPropertyValue("--meteor-target-y")).toMatch(/px$/);
  });

  test("同一种情绪的星星按星座模板落点，并在三颗后显示主星空星座提示", async () => {
    const user = userEvent.setup();
    const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => 0.5);
    window.history.pushState({}, "", "/?constellation=aries");
    const projectedAriesNodes = Object.fromEntries(
      projectConstellationNodes(
        getConstellationByKey("aries"),
        getEnvironmentComposition("wronged", "rain").skyBounds,
        window.innerWidth,
        window.innerHeight
      ).map((node) => [node.id, node])
    );

    localStorage.setItem(
      "fingertip_starry_sky_records",
      JSON.stringify([
        {
          id: "record_wronged_1",
          text: "第一颗委屈星",
          emotion: "wronged",
          createdAt: "2026-05-11 20:00:00",
          star: {
            id: "star_wronged_1",
            x: projectedAriesNodes.a1.x,
            y: projectedAriesNodes.a1.y,
            constellationKey: "aries",
            constellationNodeId: "a1",
            constellationIndex: 0
          },
          favorite: false,
          deleted: false
        },
        {
          id: "record_wronged_2",
          text: "第二颗委屈星",
          emotion: "wronged",
          createdAt: "2026-05-11 20:01:00",
          star: {
            id: "star_wronged_2",
            x: projectedAriesNodes.a2.x,
            y: projectedAriesNodes.a2.y,
            constellationKey: "aries",
            constellationNodeId: "a2",
            constellationIndex: 1
          },
          favorite: false,
          deleted: false
        }
      ])
    );

    try {
      render(<App />);

      await user.click(screen.getByRole("button", { name: "记录情绪" }));
      await user.type(screen.getByRole("textbox"), "第三颗委屈星也想被放好");
      await user.click(screen.getByRole("button", { name: "委屈" }));
      await user.click(screen.getByRole("button", { name: "完成" }));
      await user.click(screen.getByRole("button", { name: "折成纸团" }));
      await user.click(screen.getByRole("img", { name: "纸团" }));

      await waitFor(() => {
        const saved = JSON.parse(localStorage.getItem("fingertip_starry_sky_records"));
        const newStar = saved.find((record) => record.text === "第三颗委屈星也想被放好").star;
        expect(newStar).toEqual(
          expect.objectContaining({
            x: projectedAriesNodes.a4.x,
            y: projectedAriesNodes.a4.y,
            constellationKey: "aries",
            constellationNodeId: "a4",
            constellationIndex: 3
          })
        );
      });

      expect(document.querySelector(".preset-constellation-layer p")).toHaveTextContent(/forming/);
      expect(document.querySelector(".preset-constellation-layer")).toBeInTheDocument();
      expect(document.querySelector(".preset-constellation-outline line")).toBeInTheDocument();
      const outlineLines = Array.from(document.querySelectorAll(".preset-constellation-outline line"));
      expect(
        outlineLines.some(
          (line) =>
            Number(line.getAttribute("x2")) === projectedAriesNodes.a4.x &&
            Number(line.getAttribute("y2")) === projectedAriesNodes.a4.y
        )
      ).toBe(true);
      expect(document.querySelector(".preset-constellation-layer path")).not.toBeInTheDocument();
      expect(document.querySelector(".preset-constellation-layer polyline")).not.toBeInTheDocument();
    } finally {
      randomSpy.mockRestore();
      window.history.pushState({}, "", "/");
    }
  });

  test("恢复物件未点够前只显示进度，不提前显示安放完成文案", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByRole("textbox"), "这次想慢慢点亮雨滴");
    await user.click(screen.getByRole("button", { name: "委屈" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));

    await waitFor(() => {
      expect(container.querySelector(".recovery-interaction-layer")).toBeInTheDocument();
      expect(screen.getByText("已安放 0 / 2 滴雨。")).toBeInTheDocument();
    });
    expect(screen.queryByText("雨滴被星空接住了。")).not.toBeInTheDocument();

    const target = container.querySelector(".recovery-drop-target");
    const targetX = Number.parseFloat(target.style.left);
    const targetY = Number.parseFloat(target.style.top);
    const firstDrop = container.querySelector(".recovery-object");
    fireEvent.mouseDown(firstDrop, { clientX: targetX - 40, clientY: targetY - 40, pageX: targetX - 40, pageY: targetY - 40 });
    fireEvent.mouseMove(window, { clientX: targetX, clientY: targetY, pageX: targetX, pageY: targetY });
    fireEvent.mouseUp(window, { clientX: targetX, clientY: targetY, pageX: targetX, pageY: targetY });

    expect(screen.getByText("已安放 1 / 2 滴雨。")).toBeInTheDocument();
    expect(screen.queryByText("雨滴被星空接住了。")).not.toBeInTheDocument();
  });

  test("恢复物件拖拽目标使用目标星坐标定位", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "记录情绪" }));
    await user.type(screen.getByRole("textbox"), "雨滴要飞回刚刚那颗星");
    await user.click(screen.getByRole("button", { name: "委屈" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    await user.click(screen.getByRole("button", { name: "折成纸团" }));
    await user.click(screen.getByRole("img", { name: "纸团" }));

    await waitFor(() => {
      expect(container.querySelector(".recovery-interaction-layer")).toBeInTheDocument();
    });

    const target = container.querySelector(".recovery-drop-target");
    const firstObject = container.querySelector(".recovery-object");
    const targetX = Number.parseFloat(target.style.left);
    const targetY = Number.parseFloat(target.style.top);

    expect(target.style.left).toMatch(/px$/);
    expect(target.style.top).toMatch(/px$/);

    fireEvent.mouseDown(firstObject, { clientX: targetX - 40, clientY: targetY - 40, pageX: targetX - 40, pageY: targetY - 40 });
    fireEvent.mouseMove(window, { clientX: targetX, clientY: targetY, pageX: targetX, pageY: targetY });
    fireEvent.mouseUp(window, { clientX: targetX, clientY: targetY, pageX: targetX, pageY: targetY });

    expect(firstObject.style.left).toMatch(/px$/);
    expect(firstObject.style.top).toMatch(/px$/);
  });
  test("瑙傛祴鏄熺┖浣跨敤杞绘煍杩炵画璺緞鍜岀偣鐘跺井鍏夛紝涓嶅啀鐢ㄧ矖鎶樼嚎鎷兼帴", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "fingertip_starry_sky_records",
      JSON.stringify([
        { id: "r1", text: "one", emotion: "calm", createdAt: "2026-05-11 20:00:00", star: { id: "s1", x: 240, y: 130 } },
        { id: "r2", text: "two", emotion: "calm", createdAt: "2026-05-11 20:01:00", star: { id: "s2", x: 360, y: 180 } },
        { id: "r3", text: "three", emotion: "calm", createdAt: "2026-05-11 20:02:00", star: { id: "s3", x: 520, y: 150 } }
      ])
    );

    const { container } = render(<App />);
    await user.click(screen.getByRole("button", { name: "观测星空" }));

    expect(document.querySelector(".preset-constellation-outline line")).toBeInTheDocument();
    expect(document.querySelector(".preset-constellation-layer path")).not.toBeInTheDocument();
    expect(document.querySelector(".preset-constellation-layer polyline")).not.toBeInTheDocument();
    expect(container.querySelector(".preset-constellation-points")).toBeInTheDocument();
  });
});
