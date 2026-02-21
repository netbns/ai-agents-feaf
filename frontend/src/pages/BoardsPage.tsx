import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useBoards, useCreateBoard } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useRefModels } from '@/hooks/useApi';
import toast from 'react-hot-toast';
import type { CreateBoardRequest, ReferenceModel } from '@/types';

export default function BoardsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: boardsData, isLoading: isBoardsLoading } = useBoards();
  const { data: refModelsData } = useRefModels();
  const { mutate: createBoard, isLoading: isCreating } = useCreateBoard();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    referenceModel: 'PRM' as ReferenceModel,
  });

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Board name is required');
      return;
    }
    const newBoard: CreateBoardRequest = {
      name: formData.name,
      description: formData.description,
      referenceModel: formData.referenceModel,
    };
    createBoard(newBoard, {
      onSuccess: () => {
        toast.success('Board created successfully');
        setFormData({ name: '', description: '', referenceModel: 'PRM' });
        setShowForm(false);
      },
      onError: () => {
        toast.error('Failed to create board');
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Boards</h1>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New board button */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Your Boards</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'New Board'}
          </button>
        </div>

        {/* Create board form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Board</h3>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Board Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Performance Metrics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Model
                </label>
                <select
                  value={formData.referenceModel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      referenceModel: e.target.value as ReferenceModel,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {refModelsData?.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.id})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Board'}
              </button>
            </form>
          </div>
        )}

        {/* Boards grid */}
        {isBoardsLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading boards...</p>
          </div>
        ) : boardsData?.data && boardsData.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boardsData.data.map((board) => (
              <div
                key={board.id}
                onClick={() => navigate(`/boards/${board.id}`)}
                className="bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {board.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{board.description}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                    {board.referenceModel}
                  </span>
                  <span className="text-xs text-gray-500">
                    {board.componentCount || 0} components
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">No boards yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create your first board
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
