import { beforeEach, describe, expect, it } from "vitest";
import { useDesign } from "@/store/design";
import { DEFAULT_CONFIG } from "@/three/config";

describe("design store undo/redo", () => {
  beforeEach(() => useDesign.getState().load("villa-horizon", DEFAULT_CONFIG));

  it("records discrete edits and undoes/redoes them in order", () => {
    const s = useDesign.getState();
    s.setField("exterior", "wall", "brick");
    s.setField("interior", "floor", "marble");
    expect(useDesign.getState().config.exterior.wall).toBe("brick");
    useDesign.getState().undo();
    expect(useDesign.getState().config.interior.floor).toBe(DEFAULT_CONFIG.interior.floor);
    expect(useDesign.getState().config.exterior.wall).toBe("brick");
    useDesign.getState().undo();
    expect(useDesign.getState().config.exterior.wall).toBe(DEFAULT_CONFIG.exterior.wall);
    useDesign.getState().redo();
    expect(useDesign.getState().config.exterior.wall).toBe("brick");
  });

  it("collapses a continuous drag into one history entry", () => {
    const s = useDesign.getState();
    for (const t of [10, 11, 12, 13]) s.preview("environment", "time", t);
    useDesign.getState().commit();
    expect(useDesign.getState().past).toHaveLength(1);
    useDesign.getState().undo();
    expect(useDesign.getState().config.environment.time).toBe(DEFAULT_CONFIG.environment.time);
  });

  it("a new edit clears the redo stack", () => {
    const s = useDesign.getState();
    s.setField("exterior", "roof", "green");
    useDesign.getState().undo();
    useDesign.getState().setField("exterior", "roof", "flat");
    expect(useDesign.getState().future).toHaveLength(0);
  });

  it("ignores no-op edits and restores defaults as an undoable step", () => {
    const s = useDesign.getState();
    s.setField("exterior", "wall", DEFAULT_CONFIG.exterior.wall);
    expect(useDesign.getState().past).toHaveLength(0);
    s.setField("exterior", "wall", "timber");
    useDesign.getState().restoreDefaults();
    expect(useDesign.getState().config.exterior.wall).toBe(DEFAULT_CONFIG.exterior.wall);
    useDesign.getState().undo();
    expect(useDesign.getState().config.exterior.wall).toBe("timber");
  });
});
