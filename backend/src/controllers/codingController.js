import { evaluateCodingSolution, getCodingWeaknessProfile } from '../services/aiService.js';
import { run, query } from '../config/db.js';
import { calculateReadinessIndex } from '../services/readinessEngine.js';

const CODING_PROBLEMS = [
  {
    id: 1,
    title: 'Two Sum - Target Index Matching',
    difficulty: 'Easy',
    category: 'Arrays & HashMap',
    timeLimit: '20 mins',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.
You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    starterJava: `public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        java.util.Map<Integer, Integer> map = new java.util.HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
    starterPython: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`,
    sampleTestCases: [
      { input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0, 1]' },
      { input: 'nums = [3,2,4], target = 6', expectedOutput: '[1, 2]' }
    ]
  },
  {
    id: 2,
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'Sliding Window & HashSets',
    timeLimit: '30 mins',
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.`,
    starterJava: `public class Solution {
    public int lengthOfLongestSubstring(String s) {
        int maxLength = 0;
        java.util.Set<Character> set = new java.util.HashSet<>();
        int left = 0;
        for (int right = 0; right < s.length(); right++) {
            while (set.contains(s.charAt(right))) {
                set.remove(s.charAt(left));
                left++;
            }
            set.add(s.charAt(right));
            maxLength = Math.max(maxLength, right - left + 1);
        }
        return maxLength;
    }
}`,
    starterPython: `def length_of_longest_substring(s: str) -> int:
    char_set = set()
    left = 0
    max_len = 0
    for right in range(len(s)):
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        char_set.add(s[right])
        max_len = max(max_len, right - left + 1)
    return max_len`,
    sampleTestCases: [
      { input: 's = "abcabcbb"', expectedOutput: '3' },
      { input: 's = "bbbbb"', expectedOutput: '1' }
    ]
  },
  {
    id: 3,
    title: 'Reverse a Linked List',
    difficulty: 'Easy',
    category: 'Linked List',
    timeLimit: '20 mins',
    description: `Given the head of a singly linked list, reverse the list and return its head.`,
    starterJava: `public class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nextTemp = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }
}`,
    starterPython: `def reverse_list(head):
    prev = None
    curr = head
    while curr:
        next_temp = curr.next
        curr.next = prev
        prev = curr
        curr = next_temp
    return prev`,
    sampleTestCases: [
      { input: 'head = [1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' }
    ]
  },
  {
    id: 4,
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    category: 'Binary Trees & BFS',
    timeLimit: '30 mins',
    description: `Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).`,
    starterJava: `public class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            List<Integer> currentLevel = new ArrayList<>();
            for (int i = 0; i < levelSize; i++) {
                TreeNode current = queue.poll();
                currentLevel.add(current.val);
                if (current.left != null) queue.add(current.left);
                if (current.right != null) queue.add(current.right);
            }
            result.add(currentLevel);
        }
        return result;
    }
}`,
    starterPython: `def level_order(root):
    if not root:
        return []
    result = []
    queue = [root]
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.pop(0)
            level.append(node.val)
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level)
    return result`,
    sampleTestCases: [
      { input: 'root = [3,9,20,null,null,15,7]', expectedOutput: '[[3],[9,20],[15,7]]' }
    ]
  }
];

export const getCodingProblems = async (req, res) => {
  res.json(CODING_PROBLEMS);
};

export const submitCodeSolution = async (req, res) => {
  const { problemId, problemTitle, code, language } = req.body;

  if (!code || !problemTitle) {
    return res.status(400).json({ error: 'Code and problemTitle are required.' });
  }

  try {
    const evaluation = await evaluateCodingSolution(problemTitle, code, language || 'java');

    // Save submission to DB
    await run(
      `INSERT INTO coding_submissions (user_id, problem_id, problem_title, code, language, status, test_cases_passed, total_test_cases, score, runtime_ms, complexity) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        problemId || 1,
        problemTitle,
        code,
        language || 'java',
        evaluation.status,
        evaluation.testCasesPassed,
        evaluation.totalTestCases,
        evaluation.score,
        evaluation.runtimeMs,
        evaluation.timeComplexity
      ]
    );

    // Closed loop update: Recalculate Readiness Index & update DSA score
    const updatedReadiness = await calculateReadinessIndex(req.user.id);

    // Update verified skill for DSA if score >= 80
    if (evaluation.score >= 80) {
      await run(
        `INSERT INTO verified_skills (user_id, skill, level, concept_score, coding_score, debugging_score, verification_score, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, 'Data Structures & Algorithms', 'Strong', 85, evaluation.score, 80, evaluation.score, 'Verified']
      );
    }

    // Log progress
    await run(
      'INSERT INTO progress_logs (user_id, activity_type, description, metric_value) VALUES (?, ?, ?, ?)',
      [req.user.id, 'coding_assessment', `Submitted ${problemTitle} (${evaluation.status})`, evaluation.score]
    );

    res.json({
      evaluation,
      updatedReadiness: updatedReadiness.overallReadiness
    });
  } catch (error) {
    console.error('Submit code solution error:', error);
    res.status(500).json({ error: error.message || 'Internal server error evaluating code.' });
  }
};

export const getSubmissionsHistory = async (req, res) => {
  try {
    const history = await query('SELECT * FROM coding_submissions WHERE user_id = ?', [req.user.id]);
    res.json(history);
  } catch (error) {
    console.error('Get coding submissions history error:', error);
    res.status(500).json({ error: 'Internal server error fetching coding history.' });
  }
};

/**
 * Get Coding Weakness Profile (Feature 18)
 */
export const getWeaknessProfile = async (req, res) => {
  try {
    const history = await query('SELECT * FROM coding_submissions WHERE user_id = ?', [req.user.id]);
    const weaknessProfile = await getCodingWeaknessProfile(history);
    res.json(weaknessProfile);
  } catch (error) {
    console.error('Get coding weakness profile error:', error);
    res.status(500).json({ error: 'Internal server error calculating coding weakness profile.' });
  }
};
