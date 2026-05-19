import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import DriftStarDetailModal from "../components/DriftStarDetailModal";
import MainScene from "../components/MainScene";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

const baseStar = {
  id: "drift-star-1",
  text: "a soft star from the demo sky",
  emotion: "calm",
  drift_count: 3,
  created_at: "2026-05-17 20:00:00"
};

describe("drift star identity and replies", () => {
  test("sentDrift stars are identified as the user's own drifting stars", () => {
    const { container } = render(<DriftStarDetailModal star={{ ...baseStar, sourceType: "sentDrift" }} onClose={() => {}} />);

    expect(container.querySelector(".drift-source-sentDrift")).toBeInTheDocument();
    expect(container.querySelector(".drift-reply-box")).not.toBeInTheDocument();
    expect(container.querySelector("[aria-label='送它继续漂流']")).not.toBeInTheDocument();
  });

  test("sentDrift stars can be removed from the sky", () => {
    const onRemove = vi.fn();
    render(<DriftStarDetailModal star={{ ...baseStar, sourceType: "sentDrift" }} onClose={() => {}} onRemove={onRemove} />);

    fireEvent.click(screen.getByText("收回这只漂流瓶"));

    expect(onRemove).toHaveBeenCalledWith("drift-star-1");
  });

  test("receivedDrift stars keep distant-source copy and allow local demo replies", () => {
    const { container } = render(<DriftStarDetailModal star={{ ...baseStar, sourceType: "receivedDrift" }} onClose={() => {}} />);

    expect(container.querySelector(".drift-source-receivedDrift")).toBeInTheDocument();
    expect(screen.getByText("你可以给它留下一盏很小的灯。")).toBeInTheDocument();
    expect(screen.queryByText(/暂时保存在本地/)).not.toBeInTheDocument();
    const input = container.querySelector(".drift-reply-box textarea");
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "May this little light keep you company." } });
    fireEvent.click(container.querySelector(".drift-reply-actions button"));

    expect(container.querySelector(".drift-reply-message")).toBeInTheDocument();
    expect(screen.getByText("这盏小灯已经留在它身边。")).toBeInTheDocument();
    expect(screen.getByText(/May this little light/)).toBeInTheDocument();
  });

  test("empty drift replies cannot be submitted", () => {
    const { container } = render(
      <DriftStarDetailModal star={{ ...baseStar, sourceType: "demoReceivedDrift" }} onClose={() => {}} />
    );

    fireEvent.click(container.querySelector(".drift-reply-actions button"));

    expect(container.querySelector(".drift-reply-message")).toBeInTheDocument();
  });

  test("receivedDrift stars can generate an AI reply", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok", reply: "愿这点星光陪你慢慢走过今晚。", source: "openrouter" })
    });

    const { container } = render(<DriftStarDetailModal star={{ ...baseStar, emotion: "sad", sourceType: "receivedDrift" }} onClose={() => {}} />);

    fireEvent.click(screen.getByText("生成 AI 回信"));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/drifting-stars/drift-star-1/reply",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"emotion":"verySad"')
        })
      );
    });
    await waitFor(() => {
      expect(container.querySelector(".drift-reply-box textarea")).toHaveValue("愿这点星光陪你慢慢走过今晚。");
    });
  });

  test("header drift bottle opens received drift before the user's sent drift", () => {
    const sentDrift = {
      ...baseStar,
      id: "sent-drift",
      text: "sent by me",
      sourceType: "sentDrift",
      driftDirection: "sent"
    };
    const receivedDrift = {
      ...baseStar,
      id: "received-drift",
      text: "from a distant sky",
      sourceType: "demoReceivedDrift",
      driftDirection: "received"
    };
    const onSelectDriftStar = vi.fn();

    const { container } = render(
      <MainScene
        records={[]}
        starredRecords={[]}
        currentEmotion="calm"
        flowPhase="idle"
        driftingStars={[sentDrift, receivedDrift]}
        onOpenDiary={() => {}}
        onSubmitDiary={() => {}}
        onFlowPhaseChange={() => {}}
        onThrowComplete={() => {}}
        onRecoveryComplete={() => {}}
        onCancelPendingRecord={() => {}}
        onSelectStar={() => {}}
        onClearRecords={() => {}}
        onInjectDemoData={() => {}}
        onSelectConstellation={() => {}}
        onSelectDriftStar={onSelectDriftStar}
        onPublishAsDrift={() => {}}
        onDismissDriftPrompt={() => {}}
      />
    );

    fireEvent.click(container.querySelector(".header-actions [aria-label='查看漂流星星']"));

    expect(onSelectDriftStar).toHaveBeenCalledWith(receivedDrift);
  });
});
