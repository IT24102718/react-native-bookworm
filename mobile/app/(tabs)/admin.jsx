import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	RefreshControl,
	TextInput,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import Loader from "../../components/Loader";
import GradientBackground from "../../components/GradientBackground";
import styles from "../../assets/styles/admin.styles";

const formatDate = (value) => {
	if (!value) return "";
	const parsedDate = new Date(value);
	if (Number.isNaN(parsedDate.getTime())) return "";
	return parsedDate.toLocaleDateString();
};

const formatAddress = (address) => {
	if (!address) return "No address";

	const parts = [address.street, address.city, address.postalCode, address.country]
		.filter((item) => typeof item === "string" && item.trim().length > 0)
		.map((item) => item.trim());

	return parts.length > 0 ? parts.join(", ") : "No address";
};

const USERS_PREVIEW_COUNT = 2;

export default function AdminScreen() {
	const router = useRouter();
	const { user, token, isCheckingAuth } = useAuthStore();

	const [totalBooks, setTotalBooks] = useState(0);
	const [categories, setCategories] = useState([]);
	const [lowStockBooks, setLowStockBooks] = useState([]);
	const [users, setUsers] = useState([]);
	const [showAllUsers, setShowAllUsers] = useState(false);
	const [userSearch, setUserSearch] = useState("");
	const [expandedUserId, setExpandedUserId] = useState(null);
	const [userAction, setUserAction] = useState({ id: null, type: null });
	const [isLoading, setIsLoading] = useState(true);
	const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
	const [isLowStockLoading, setIsLowStockLoading] = useState(false);
	const [isUsersLoading, setIsUsersLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [deletingCategoryId, setDeletingCategoryId] = useState(null);
	const [categoryName, setCategoryName] = useState("");
	const [categoryDescription, setCategoryDescription] = useState("");
	const [editingCategoryId, setEditingCategoryId] = useState(null);
	const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
	const latestUserSearch = useRef("");

	const isAdmin = useMemo(() => Boolean(user?.isAdmin), [user]);
	const currentUserId = user?.id || user?._id || null;

	useEffect(() => {
		latestUserSearch.current = userSearch;
	}, [userSearch]);

	const fetchBookSummary = useCallback(async ({ silent = false } = {}) => {
		try {
			if (!silent) setIsLoading(true);

			const response = await fetch(`${API_URL}/books?limit=1`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "Failed to load books");

			setTotalBooks(typeof data?.totalBooks === "number" ? data.totalBooks : 0);
		} catch (error) {
			Alert.alert("Error", error.message || "Failed to load books");
		} finally {
			if (!silent) setIsLoading(false);
		}
	}, [token]);

	const fetchCategories = useCallback(async ({ silent = false } = {}) => {
		try {
			if (!silent) setIsCategoriesLoading(true);

			const response = await fetch(`${API_URL}/categories`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "Failed to load categories");

			setCategories(Array.isArray(data) ? data : []);
		} catch (error) {
			Alert.alert("Error", error.message || "Failed to load categories");
		} finally {
			if (!silent) setIsCategoriesLoading(false);
		}
	}, [token]);

	const fetchLowStockAlerts = useCallback(async ({ silent = false } = {}) => {
		try {
			if (!silent) setIsLowStockLoading(true);

			const response = await fetch(`${API_URL}/stock/alerts/low`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "Failed to load low stock alerts");

			setLowStockBooks(Array.isArray(data?.books) ? data.books : []);
		} catch (error) {
			Alert.alert("Error", error.message || "Failed to load low stock alerts");
		} finally {
			if (!silent) setIsLowStockLoading(false);
		}
	}, [token]);

	const fetchUsers = useCallback(async ({ silent = false, search = "" } = {}) => {
		try {
			if (!silent) setIsUsersLoading(true);

			const params = new URLSearchParams();
			if (search) params.append("search", search);
			params.append("limit", "40");

			const response = await fetch(`${API_URL}/users?${params.toString()}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "Failed to load users");

			setUsers(Array.isArray(data?.users) ? data.users : []);
		} catch (error) {
			Alert.alert("Error", error.message || "Failed to load users");
		} finally {
			if (!silent) setIsUsersLoading(false);
		}
	}, [token]);

	useFocusEffect(
		useCallback(() => {
			if (!token || !isAdmin) {
				setIsLoading(false);
				setIsCategoriesLoading(false);
				setIsLowStockLoading(false);
				setIsUsersLoading(false);
				return;
			}
			fetchBookSummary();
			fetchCategories();
			fetchLowStockAlerts();
			fetchUsers({ search: latestUserSearch.current.trim() });
		}, [token, isAdmin, fetchBookSummary, fetchCategories, fetchLowStockAlerts, fetchUsers])
	);

	const resetCategoryForm = () => {
		setCategoryName("");
		setCategoryDescription("");
		setEditingCategoryId(null);
	};

	const handleCategorySubmit = async () => {
		const trimmedName = categoryName.trim();
		const trimmedDescription = categoryDescription.trim();

		if (!trimmedName) {
			Alert.alert("Error", "Category name is required");
			return;
		}

		try {
			setIsCategorySubmitting(true);

			const response = await fetch(
				editingCategoryId ? `${API_URL}/categories/${editingCategoryId}` : `${API_URL}/categories`,
				{
					method: editingCategoryId ? "PUT" : "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: trimmedName,
						description: trimmedDescription,
					}),
				}
			);

			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "Failed to save category");

			Alert.alert("Success", editingCategoryId ? "Category updated" : "Category added");
			resetCategoryForm();
			await fetchCategories({ silent: true });
		} catch (error) {
			Alert.alert("Error", error.message || "Failed to save category");
		} finally {
			setIsCategorySubmitting(false);
		}
	};

	const startEditCategory = (category) => {
		setEditingCategoryId(category._id);
		setCategoryName(category.name || "");
		setCategoryDescription(category.description || "");
	};

	const handleDeleteCategory = async (categoryId) => {
		try {
			setDeletingCategoryId(categoryId);

			const response = await fetch(`${API_URL}/categories/${categoryId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "Failed to delete category");

			setCategories((prev) => prev.filter((item) => item._id !== categoryId));
			if (editingCategoryId === categoryId) {
				resetCategoryForm();
			}
			Alert.alert("Success", data.message || "Category deleted successfully");
		} catch (error) {
			Alert.alert("Error", error.message || "Failed to delete category");
		} finally {
			setDeletingCategoryId(null);
		}
	};

	const confirmDeleteCategory = (categoryId) => {
		Alert.alert("Delete Category", "Are you sure you want to delete this category?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => handleDeleteCategory(categoryId),
			},
		]);
	};


	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			await Promise.all([
				fetchBookSummary({ silent: true }),
				fetchCategories({ silent: true }),
				fetchLowStockAlerts({ silent: true }),
				fetchUsers({ silent: true, search: userSearch.trim() }),
			]);
		} finally {
			setRefreshing(false);
		}
	};

	const handleUserSearch = async () => {
		setShowAllUsers(false);
		await fetchUsers({ search: userSearch.trim() });
	};

	const handleClearUserSearch = async () => {
		setUserSearch("");
		setShowAllUsers(false);
		await fetchUsers({ search: "" });
	};

	const isSelf = (userId) => Boolean(userId && currentUserId && userId === currentUserId);
	const visibleUsers = showAllUsers ? users : users.slice(0, USERS_PREVIEW_COUNT);
	const hiddenUsersCount = Math.max(users.length - USERS_PREVIEW_COUNT, 0);

	const updateUserInList = (userId, updates) => {
		setUsers((prev) =>
			prev.map((item) => (item._id === userId ? { ...item, ...updates } : item))
		);
	};

	const removeUserFromList = (userId) => {
		setUsers((prev) => prev.filter((item) => item._id !== userId));
		if (expandedUserId === userId) {
			setExpandedUserId(null);
		}
	};

	const handleToggleAdmin = async (targetUser) => {
		if (isSelf(targetUser._id)) {
			Alert.alert("Action not allowed", "You cannot change your own admin role.");
			return;
		}

		const nextIsAdmin = !targetUser.isAdmin;
		Alert.alert(
			nextIsAdmin ? "Promote user" : "Remove admin",
			nextIsAdmin
				? `Make ${targetUser.username} an admin?`
				: `Remove admin rights from ${targetUser.username}?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: nextIsAdmin ? "Promote" : "Remove",
					style: nextIsAdmin ? "default" : "destructive",
					onPress: async () => {
						try {
							setUserAction({ id: targetUser._id, type: "role" });
							const response = await fetch(`${API_URL}/users/${targetUser._id}/role`, {
								method: "PATCH",
								headers: {
									Authorization: `Bearer ${token}`,
									"Content-Type": "application/json",
								},
								body: JSON.stringify({ isAdmin: nextIsAdmin }),
							});

							const data = await response.json();
							if (!response.ok) throw new Error(data.message || "Failed to update role");

							updateUserInList(targetUser._id, data.user || { isAdmin: nextIsAdmin });
							Alert.alert("Success", data.message || "User role updated");
						} catch (error) {
							Alert.alert("Error", error.message || "Failed to update role");
						} finally {
							setUserAction({ id: null, type: null });
						}
					},
				},
			]
		);
	};

	const handleToggleStatus = async (targetUser) => {
		if (isSelf(targetUser._id)) {
			Alert.alert("Action not allowed", "You cannot change your own status.");
			return;
		}

		const nextIsActive = !targetUser.isActive;
		Alert.alert(
			nextIsActive ? "Reactivate user" : "Deactivate user",
			nextIsActive
				? `Reactivate ${targetUser.username}'s account?`
				: `Deactivate ${targetUser.username}'s account?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: nextIsActive ? "Reactivate" : "Deactivate",
					style: nextIsActive ? "default" : "destructive",
					onPress: async () => {
						try {
							setUserAction({ id: targetUser._id, type: "status" });
							const response = await fetch(`${API_URL}/users/${targetUser._id}/status`, {
								method: "PATCH",
								headers: {
									Authorization: `Bearer ${token}`,
									"Content-Type": "application/json",
								},
								body: JSON.stringify({ isActive: nextIsActive }),
							});

							const data = await response.json();
							if (!response.ok) throw new Error(data.message || "Failed to update status");

							updateUserInList(targetUser._id, data.user || { isActive: nextIsActive });
							Alert.alert("Success", data.message || "User status updated");
						} catch (error) {
							Alert.alert("Error", error.message || "Failed to update status");
						} finally {
							setUserAction({ id: null, type: null });
						}
					},
				},
			]
		);
	};

	const handleDeleteUser = (targetUser) => {
		if (isSelf(targetUser._id)) {
			Alert.alert("Action not allowed", "You cannot delete your own account.");
			return;
		}

		Alert.alert(
			"Delete user",
			`This will permanently remove ${targetUser.username}. Continue?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							setUserAction({ id: targetUser._id, type: "delete" });
							const response = await fetch(`${API_URL}/users/${targetUser._id}`, {
								method: "DELETE",
								headers: { Authorization: `Bearer ${token}` },
							});

							const data = await response.json();
							if (!response.ok) throw new Error(data.message || "Failed to delete user");

							removeUserFromList(targetUser._id);
							Alert.alert("Success", data.message || "User deleted");
						} catch (error) {
							Alert.alert("Error", error.message || "Failed to delete user");
						} finally {
							setUserAction({ id: null, type: null });
						}
					},
				},
			]
		);
	};

	const handleResetPassword = (targetUser) => {
		if (isSelf(targetUser._id)) {
			Alert.alert("Action not allowed", "Use account settings to change your password.");
			return;
		}

		Alert.alert(
			"Reset password",
			`Generate a temporary password for ${targetUser.username}?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Generate",
					onPress: async () => {
						try {
							setUserAction({ id: targetUser._id, type: "reset" });
							const response = await fetch(`${API_URL}/users/${targetUser._id}/reset-password`, {
								method: "POST",
								headers: { Authorization: `Bearer ${token}` },
							});

							const data = await response.json();
							if (!response.ok) throw new Error(data.message || "Failed to reset password");

							Alert.alert(
								"Temporary password",
								`Share this temporary password securely:\n\n${data.temporaryPassword}`
							);
						} catch (error) {
							Alert.alert("Error", error.message || "Failed to reset password");
						} finally {
							setUserAction({ id: null, type: null });
						}
					},
				},
			]
		);
	};

	if (isCheckingAuth) return null;
	if (!user || !token) return <Redirect href="/(auth)" />;
	if (!isAdmin) return <Redirect href="/profile" />;

	if (isLoading && !refreshing) return <Loader />;

	return (
		<GradientBackground>
		<View style={styles.container}>
			<FlatList
				data={[]}
				renderItem={() => null}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.booksList}
				ListHeaderComponent={
					<>
						<View style={styles.header}>
							<View>
								<Text style={styles.heading}>Admin Settings</Text>
								<Text style={styles.subheading}>Manage inventory, users, and storefront content.</Text>
							</View>
							<View style={styles.headerBadge}>
								<Ionicons name="shield-checkmark-outline" size={16} color={COLORS.white} />
								<Text style={styles.headerBadgeText}>Admin</Text>
							</View>
						</View>

						<View style={styles.statsRow}>
							<View style={styles.statCard}>
								<Text style={styles.statLabel}>Books</Text>
								<Text style={styles.statValue}>{totalBooks}</Text>
							</View>
							<View style={styles.statCard}>
								<Text style={styles.statLabel}>Categories</Text>
								<Text style={styles.statValue}>{categories.length}</Text>
							</View>
							<View style={styles.statCard}>
								<Text style={styles.statLabel}>Users</Text>
								<Text style={styles.statValue}>{users.length}</Text>
							</View>
							<View style={styles.statCard}>
								<Text style={styles.statLabel}>Low Stock</Text>
								<Text style={styles.statValue}>{lowStockBooks.length}</Text>
							</View>
						</View>

						<View style={styles.sectionCard}>
							<View style={styles.sectionHeader}>
								<Text style={styles.sectionTitle}>Quick Actions</Text>
								<Text style={styles.sectionSubtitle}>Inventory & orders</Text>
							</View>
							<View style={styles.actionGrid}>
								<TouchableOpacity
									style={styles.actionTile}
									onPress={() =>
										router.push({ pathname: "/manage-book", params: { bookId: "" } })
									}
								>
									<Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
									<Text style={styles.actionTileText}>Add Book</Text>
								</TouchableOpacity>
								<TouchableOpacity style={styles.actionTile} onPress={() => router.push("/admin-books")}>
									<Ionicons name="book-outline" size={20} color={COLORS.primary} />
									<Text style={styles.actionTileText}>Current Books</Text>
								</TouchableOpacity>
								<TouchableOpacity style={styles.actionTile} onPress={() => router.push("/stock")}>
									<Ionicons name="cube-outline" size={20} color={COLORS.primary} />
									<Text style={styles.actionTileText}>Manage Stock</Text>
								</TouchableOpacity>
								<TouchableOpacity style={styles.actionTile} onPress={() => router.push("/orders")}>
									<Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
									<Text style={styles.actionTileText}>Orders</Text>
								</TouchableOpacity>
							</View>
						</View>

						<View style={styles.sectionCard}>
							<View style={styles.sectionHeader}>
								<Text style={styles.sectionTitle}>User Management</Text>
								<View style={styles.sectionCountBadge}>
									<Text style={styles.sectionCountText}>{users.length}</Text>
								</View>
							</View>

							<View style={styles.searchRow}>
								<View style={styles.searchField}>
									<Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
									<TextInput
										style={styles.searchInput}
										value={userSearch}
										onChangeText={setUserSearch}
										placeholder="Search by name or email"
										placeholderTextColor={COLORS.placeholderText}
										returnKeyType="search"
										onSubmitEditing={handleUserSearch}
									/>
								</View>
								{userSearch ? (
									<TouchableOpacity style={styles.clearButton} onPress={handleClearUserSearch}>
										<Ionicons name="close" size={18} color={COLORS.textPrimary} />
									</TouchableOpacity>
								) : null}
								<TouchableOpacity style={styles.searchButton} onPress={handleUserSearch}>
									<Text style={styles.searchButtonText}>Search</Text>
								</TouchableOpacity>
							</View>

							{isUsersLoading ? (
								<ActivityIndicator size="small" color={COLORS.primary} />
							) : users.length > 0 ? (
								visibleUsers.map((item) => {
									const isExpanded = expandedUserId === item._id;
									const isInactive = item.isActive === false;
									const isAdminUser = item.isAdmin === true;
									const isCurrent = isSelf(item._id);

									return (
										<View key={item._id} style={styles.userCard}>
											<TouchableOpacity
												style={styles.userRow}
												onPress={() =>
													setExpandedUserId((prev) => (prev === item._id ? null : item._id))
												}
											>
												{item.profileImage ? (
													<Image source={{ uri: item.profileImage }} style={styles.userAvatarImage} />
												) : (
													<View style={styles.userAvatarPlaceholder}>
														<Text style={styles.userAvatarText}>
															{(item.username || "U").slice(0, 1).toUpperCase()}
														</Text>
													</View>
												)}

												<View style={styles.userInfo}>
													<Text style={styles.userName}>{item.username}</Text>
													<Text style={styles.userEmail}>{item.email}</Text>
													<View style={styles.userBadges}>
														{isAdminUser ? (
															<View style={[styles.badge, styles.badgeAdmin]}>
																<Text style={[styles.badgeText, styles.badgeTextAdmin]}>Admin</Text>
															</View>
														) : (
															<View style={styles.badge}>
																<Text style={styles.badgeText}>User</Text>
															</View>
														)}
														{isInactive ? (
															<View style={[styles.badge, styles.badgeInactive]}>
																<Text style={[styles.badgeText, styles.badgeTextInactive]}>Inactive</Text>
															</View>
														) : (
															<View style={styles.badge}>
																<Text style={styles.badgeText}>Active</Text>
															</View>
														)}
														{isCurrent ? (
															<View style={[styles.badge, styles.badgeCurrent]}>
																<Text style={[styles.badgeText, styles.badgeTextCurrent]}>You</Text>
															</View>
														) : null}
													</View>
												</View>

												<Ionicons
													name={isExpanded ? "chevron-up" : "chevron-down"}
													size={20}
													color={COLORS.textSecondary}
												/>
											</TouchableOpacity>

											{isExpanded ? (
												<View style={styles.userDetails}>
													<View style={styles.detailRow}>
														<Text style={styles.detailLabel}>Joined</Text>
														<Text style={styles.detailValue}>{formatDate(item.createdAt) || "-"}</Text>
													</View>
													<View style={styles.detailRow}>
														<Text style={styles.detailLabel}>Address</Text>
														<Text style={styles.detailValue}>{formatAddress(item.address)}</Text>
													</View>
													{item.deactivatedAt ? (
														<View style={styles.detailRow}>
															<Text style={styles.detailLabel}>Deactivated</Text>
															<Text style={styles.detailValue}>{formatDate(item.deactivatedAt)}</Text>
														</View>
													) : null}

													<View style={styles.userActionsRow}>
														<TouchableOpacity
															style={[
																styles.actionPill,
																styles.actionPillPrimary,
																isCurrent ? styles.actionPillDisabled : null,
															]}
															onPress={() => handleToggleAdmin(item)}
															disabled={isCurrent || userAction.id === item._id}
														>
															{userAction.id === item._id && userAction.type === "role" ? (
																<ActivityIndicator size="small" color={COLORS.primary} />
															) : (
																<>
																	<Ionicons name="key-outline" size={14} color={COLORS.primary} />
																	<Text style={[styles.actionPillText, styles.actionPillTextPrimary]}>
																		{isAdminUser ? "Remove admin" : "Make admin"}
																	</Text>
																</>
															)}
														</TouchableOpacity>

														<TouchableOpacity
															style={[
																styles.actionPill,
																styles.actionPillWarning,
																isCurrent ? styles.actionPillDisabled : null,
															]}
															onPress={() => handleToggleStatus(item)}
															disabled={isCurrent || userAction.id === item._id}
														>
															{userAction.id === item._id && userAction.type === "status" ? (
																<ActivityIndicator size="small" color={COLORS.textPrimary} />
															) : (
																<>
																	<Ionicons name="shield-outline" size={14} color={COLORS.textPrimary} />
																	<Text style={styles.actionPillText}>
																		{isInactive ? "Reactivate" : "Deactivate"}
																	</Text>
																</>
															)}
														</TouchableOpacity>

														<TouchableOpacity
															style={[
																styles.actionPill,
																styles.actionPillNeutral,
																isCurrent ? styles.actionPillDisabled : null,
															]}
															onPress={() => handleResetPassword(item)}
															disabled={isCurrent || userAction.id === item._id}
														>
															{userAction.id === item._id && userAction.type === "reset" ? (
																<ActivityIndicator size="small" color={COLORS.textPrimary} />
															) : (
																<>
																	<Ionicons name="refresh-outline" size={14} color={COLORS.textPrimary} />
																	<Text style={styles.actionPillText}>Reset password</Text>
																</>
															)}
														</TouchableOpacity>

														<TouchableOpacity
															style={[
																styles.actionPill,
																styles.actionPillDanger,
																isCurrent ? styles.actionPillDisabled : null,
															]}
															onPress={() => handleDeleteUser(item)}
															disabled={isCurrent || userAction.id === item._id}
														>
															{userAction.id === item._id && userAction.type === "delete" ? (
																<ActivityIndicator size="small" color={COLORS.danger} />
															) : (
																<>
																	<Ionicons name="trash-outline" size={14} color={COLORS.danger} />
																	<Text style={[styles.actionPillText, styles.actionPillTextDanger]}>
																		Delete
																	</Text>
																</>
															)}
														</TouchableOpacity>
													</View>
												</View>
											) : null}
										</View>
									);
								})
							) : (
								<View style={styles.emptyInlineContainer}>
									<Text style={styles.emptyInlineText}>No users found</Text>
								</View>
							)}
							{users.length > USERS_PREVIEW_COUNT ? (
								<TouchableOpacity
									style={styles.showMoreUsersButton}
									onPress={() => setShowAllUsers((prev) => !prev)}
								>
									<Ionicons
										name={showAllUsers ? "chevron-up-outline" : "chevron-down-outline"}
										size={16}
										color={COLORS.primary}
									/>
									<Text style={styles.showMoreUsersButtonText}>
										{showAllUsers
											? "Show less users"
											: `See more users (${hiddenUsersCount} more)`}
									</Text>
								</TouchableOpacity>
							) : null}
						</View>

						<View style={styles.sectionCard}>
							<View style={styles.sectionHeader}>
								<Text style={styles.sectionTitle}>Low Stock Alerts</Text>
								<View style={styles.sectionCountBadge}>
									<Text style={styles.sectionCountText}>{lowStockBooks.length}</Text>
								</View>
							</View>

							{isLowStockLoading ? (
								<ActivityIndicator size="small" color={COLORS.primary} />
							) : lowStockBooks.length > 0 ? (
								lowStockBooks.map((book) => (
									<View key={book._id} style={styles.lowStockItem}>
										<Text style={styles.lowStockTitle} numberOfLines={1}>
											{book.title}
										</Text>
										<Text style={styles.lowStockMeta}>
											Qty: {typeof book.stockQuantity === "number" ? book.stockQuantity : "N/A"}
										</Text>
										{typeof book.lowStockThreshold === "number" ? (
											<Text style={styles.lowStockMeta}>Threshold: {book.lowStockThreshold}</Text>
										) : null}
									</View>
								))
							) : (
								<View style={styles.emptyInlineContainer}>
									<Text style={styles.emptyInlineText}>No low stock alerts</Text>
								</View>
							)}
						</View>

						<View style={styles.sectionCard}>
							<View style={styles.sectionHeader}>
								<Text style={styles.sectionTitle}>Category Management</Text>
								<View style={styles.sectionCountBadge}>
									<Text style={styles.sectionCountText}>{categories.length}</Text>
								</View>
							</View>

							<View style={styles.inputGroup}>
								<Text style={styles.inputLabel}>Category name</Text>
								<TextInput
									style={styles.input}
									value={categoryName}
									onChangeText={setCategoryName}
									placeholder="Enter category name"
									placeholderTextColor={COLORS.placeholderText}
								/>
							</View>

							<View style={styles.inputGroup}>
								<Text style={styles.inputLabel}>Description (optional)</Text>
								<TextInput
									style={styles.input}
									value={categoryDescription}
									onChangeText={setCategoryDescription}
									placeholder="Enter category description"
									placeholderTextColor={COLORS.placeholderText}
								/>
							</View>

							<View style={styles.categoryActionRow}>
								<TouchableOpacity
									style={styles.primaryAction}
									onPress={handleCategorySubmit}
									disabled={isCategorySubmitting}
								>
									{isCategorySubmitting ? (
										<ActivityIndicator size="small" color={COLORS.white} />
									) : (
										<>
											<Ionicons
												name={editingCategoryId ? "save-outline" : "add-circle-outline"}
												size={20}
												color={COLORS.white}
											/>
											<Text style={styles.primaryActionText}>
												{editingCategoryId ? "Update Category" : "Add Category"}
											</Text>
										</>
									)}
								</TouchableOpacity>

								{editingCategoryId ? (
									<TouchableOpacity style={styles.secondaryAction} onPress={resetCategoryForm}>
										<Text style={styles.secondaryActionText}>Cancel Edit</Text>
									</TouchableOpacity>
								) : null}
							</View>

							{isCategoriesLoading ? (
								<ActivityIndicator size="small" color={COLORS.primary} />
							) : categories.length > 0 ? (
								categories.map((category) => (
									<View key={category._id} style={styles.categoryItem}>
										<View style={styles.categoryInfo}>
											<Text style={styles.categoryName}>{category.name}</Text>
											<Text style={styles.categoryDescription} numberOfLines={2}>
												{category.description || "No description"}
											</Text>
										</View>

										<View style={styles.actionsContainer}>
											<TouchableOpacity style={styles.iconButton} onPress={() => startEditCategory(category)}>
												<Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
											</TouchableOpacity>

											<TouchableOpacity
												style={styles.iconButton}
												onPress={() => confirmDeleteCategory(category._id)}
											>
												{deletingCategoryId === category._id ? (
													<ActivityIndicator size="small" color={COLORS.primary} />
												) : (
													<Ionicons name="trash-outline" size={20} color={COLORS.primary} />
												)}
											</TouchableOpacity>
										</View>
									</View>
								))
							) : (
								<View style={styles.emptyInlineContainer}>
									<Text style={styles.emptyInlineText}>No categories available</Text>
								</View>
							)}
						</View>

					</>
				}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						colors={[COLORS.primary]}
						tintColor={COLORS.primary}
					/>
				}
			/>
		</View>
		</GradientBackground>
	);
}
