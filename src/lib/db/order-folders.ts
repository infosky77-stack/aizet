import { randomUUID } from 'crypto';
import db from '@/lib/db';
import { MediaOrder } from '@/lib/db/media-orders';

/**
 * 슈퍼에디터 폴더 트리 — 공용 코어 모듈.
 *
 * media_orders(주문/결제)와 완전히 분리된 별도 테이블(super_editor_folders)이다.
 * 폴더 노드에는 is_paid/payment_id/status 같은 결제 컬럼이 전혀 없어서,
 * 폴더 id는 애초에 markPaid() 같은 결제 함수에 넘길 수 있는 id 종류가 아니다.
 *
 * order_type을 전혀 모르는 순수 트리 구조라서 잡지뿐 아니라 명함/도록/영상도
 * 나중에 media_orders.folder_id로 그대로 얹을 수 있다. domain 필드는 UI 구분용
 * 문자열일 뿐 이 모듈의 어떤 함수도 domain "값"으로 분기하지 않는다 — listFolders/
 * buildFolderTree의 선택적 domain 인자는 같은 값끼리 묶는 WHERE 필터일 뿐이다
 * (잡지 팝업엔 잡지 폴더만, 영상 팝업엔 영상 폴더만 보이게).
 */

export type FolderDomain = 'generic' | 'magazine' | 'card' | 'catalog' | 'video' | 'product' | 'education';

export interface OrderFolder {
  id:                string;
  user_id:           string;
  parent_folder_id:  string | null;
  title:             string;
  domain:            FolderDomain;
  sort_order:        number | null;
  created_at:        number;
  updated_at:        number;
}

export interface FolderTreeNode extends OrderFolder {
  children:   FolderTreeNode[];
  leafOrders: MediaOrder[];
}

export function createFolder(
  userId: string,
  parentFolderId: string | null,
  title: string,
  domain: FolderDomain = 'generic',
): OrderFolder {
  const id  = randomUUID();
  const now = Date.now();
  db.prepare(`
    INSERT INTO super_editor_folders (id, user_id, parent_folder_id, title, domain, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, parentFolderId, title, domain, now, now);
  return getFolder(id)!;
}

export function getFolder(id: string): OrderFolder | null {
  return db.prepare<[string], OrderFolder>(
    'SELECT * FROM super_editor_folders WHERE id=?'
  ).get(id) ?? null;
}

// 유저의 폴더 전체(flat) — 트리는 buildFolderTree가 메모리에서 조립한다.
// domain을 주면 그 도메인 폴더만(팝업별 분리). 하위 폴더도 생성 시 같은 domain을 받으므로
// flat 필터만으로 트리가 온전히 나뉜다.
export function listFolders(userId: string, domain?: FolderDomain): OrderFolder[] {
  if (domain) {
    return db.prepare<[string, string], OrderFolder>(
      'SELECT * FROM super_editor_folders WHERE user_id=? AND domain=? ORDER BY sort_order ASC, created_at ASC'
    ).all(userId, domain) as OrderFolder[];
  }
  return db.prepare<[string], OrderFolder>(
    'SELECT * FROM super_editor_folders WHERE user_id=? ORDER BY sort_order ASC, created_at ASC'
  ).all(userId) as OrderFolder[];
}

function listLeafOrders(userId: string): MediaOrder[] {
  return db.prepare<[string], MediaOrder>(
    "SELECT * FROM media_orders WHERE user_id=? AND folder_id IS NOT NULL"
  ).all(userId) as MediaOrder[];
}

// SQL 재귀(WITH RECURSIVE) 대신 flat SELECT 2번 + 메모리 조립(O(N)).
// 유저 1명당 폴더 개수가 많지 않을 것으로 예상되는 규모에서는 이 방식이 더 단순하고 안전하다.
// leaf 주문은 folder_id가 필터된 폴더 집합에 속할 때만 붙으므로 domain 필터가 자연히 전파된다.
export function buildFolderTree(userId: string, domain?: FolderDomain): FolderTreeNode[] {
  const flat = listFolders(userId, domain);
  const byId = new Map<string, FolderTreeNode>(
    flat.map((f) => [f.id, { ...f, children: [], leafOrders: [] }]),
  );
  const roots: FolderTreeNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parent_folder_id ? byId.get(node.parent_folder_id) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  for (const order of listLeafOrders(userId)) {
    byId.get(order.folder_id!)?.leafOrders.push(order);
  }
  return roots;
}

// 현재 폴더에서 최상위까지의 경로(breadcrumb) — parent_folder_id를 타고 올라가는 단순 루프.
export function getFolderPath(userId: string, folderId: string): OrderFolder[] {
  const byId = new Map(listFolders(userId).map((f) => [f.id, f]));
  const path: OrderFolder[] = [];
  let current = byId.get(folderId);
  while (current) {
    path.unshift(current);
    current = current.parent_folder_id ? byId.get(current.parent_folder_id) : undefined;
  }
  return path;
}

function collectDescendantFolderIds(byParent: Map<string | null, OrderFolder[]>, startId: string): string[] {
  const result: string[] = [];
  const stack = [...(byParent.get(startId) ?? [])];
  while (stack.length) {
    const node = stack.pop()!;
    result.push(node.id);
    stack.push(...(byParent.get(node.id) ?? []));
  }
  return result;
}

function groupByParent(flat: OrderFolder[]): Map<string | null, OrderFolder[]> {
  const map = new Map<string | null, OrderFolder[]>();
  for (const f of flat) {
    const key = f.parent_folder_id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(f);
  }
  return map;
}

// 자기 자신 + 모든 하위 폴더 중 결제된(is_paid=1) leaf 주문이 하나라도 있으면 삭제 거부.
// foreign_keys pragma가 꺼져 있어 DB 레벨 CASCADE가 실제로 동작하지 않으므로,
// 삭제 가능 여부 판단과 실제 삭제(재귀) 둘 다 애플리케이션 코드가 직접 처리한다.
export function canDeleteFolder(userId: string, folderId: string): boolean {
  const flat = listFolders(userId);
  const byParent = groupByParent(flat);
  const subtreeIds = [folderId, ...collectDescendantFolderIds(byParent, folderId)];
  const placeholders = subtreeIds.map(() => '?').join(',');
  const paidLeaf = db.prepare(
    `SELECT 1 FROM media_orders WHERE folder_id IN (${placeholders}) AND is_paid=1 LIMIT 1`
  ).get(...subtreeIds);
  return !paidLeaf;
}

// canDeleteFolder(userId, folderId)를 먼저 확인한 뒤 호출할 것. 미결제 leaf와 하위 폴더 전체를 함께 삭제한다.
export function deleteFolderRecursive(userId: string, folderId: string): void {
  const flat = listFolders(userId);
  const byParent = groupByParent(flat);
  const subtreeIds = [folderId, ...collectDescendantFolderIds(byParent, folderId)];
  const placeholders = subtreeIds.map(() => '?').join(',');

  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM media_orders WHERE folder_id IN (${placeholders}) AND user_id=?`)
      .run(...subtreeIds, userId);
    db.prepare(`DELETE FROM super_editor_folders WHERE id IN (${placeholders}) AND user_id=?`)
      .run(...subtreeIds, userId);
  });
  tx();
}
